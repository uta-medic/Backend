import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const required = this.configService.get<boolean>('DB_REQUIRED', false);
    const url = this.configService.get<string>('SUPABASE_URL')?.trim();
    const serviceRoleKey = this.configService
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();

    if (!url || !serviceRoleKey) {
      const missingKeys = [
        ['SUPABASE_URL', url],
        ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
      ]
        .filter(([, value]) => !value)
        .map(([key]) => key);
      const message = `Configuracion Supabase incompleta: ${missingKeys.join(', ')}`;

      if (required) {
        throw new InternalServerErrorException(message);
      }

      this.logger.warn(`${message}. La aplicacion continuara sin Supabase.`);
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    await this.checkConnection(required);
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Supabase no esta configurado en este momento.',
      );
    }

    return this.client;
  }

  private async checkConnection(required: boolean): Promise<void> {
    if (!this.client) {
      return;
    }

    const retries = this.configService.get<number>('DB_CONNECT_RETRIES', 3);

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const { error } = await this.client
        .from('patients')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (!error) {
        this.logger.log('Conectado a Supabase.');
        return;
      }

      this.logger.error(
        `No se pudo conectar con Supabase (intento ${attempt}/${retries}). ${error.message}`,
      );

      if (attempt < retries) {
        await this.sleep(attempt * 1_000);
      }
    }

    if (required) {
      throw new InternalServerErrorException(
        'No se pudo establecer conexion con Supabase.',
      );
    }

    this.logger.warn(
      'Supabase no esta disponible. La aplicacion continuara y los endpoints que requieren datos clinicos responderan 503.',
    );
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
