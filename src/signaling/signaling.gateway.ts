import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedUser {
  userId: string;
  ci: string;
  name: string;
  role: UserRole;
}

interface WaitingPatient {
  socketId: string;
  name: string;
  ci: string;
}

interface RoomInfo {
  doctorSocketId?: string;
  waitingPatient?: WaitingPatient;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'https://uta-medic.vercel.app',
      'https://jolly-field-07dc5a10f.7.azurestaticapps.net',
    ],
    credentials: true,
  },
})
//@WebSocketGateway({ cors: { origin: 'https://jolly-field-07dc5a10f.7.azurestaticapps.net' } })
//@WebSocketGateway({ cors: { origin: '*' } })
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, RoomInfo>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Se ejecuta en cada conexión nueva de socket.
   * El cliente debe enviar el token así: io(url, { auth: { token: '<JWT>' } })
   * - Si manda un token válido: queda autenticado (client.data.user).
   * - Si manda un token inválido/expirado: se desconecta (probable intento de fraude).
   * - Si no manda token: se permite la conexión sin autenticar (para el chat de soporte anónimo),
   *   pero no podrá usar 'register-role' como doctor/paciente.
   */
  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      console.log(`[AUDITORÍA] Cliente ${client.id} conectado sin token (modo anónimo/soporte)`);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.data.user = {
        userId: payload.sub,
        ci: payload.ci,
        name: payload.name,
        role: payload.role,
      } as AuthenticatedUser;
      console.log(`[AUDITORÍA] Cliente ${client.id} autenticado como ${payload.role} (${payload.name})`);
    } catch {
      console.log(`[AUDITORÍA] Cliente ${client.id} rechazado: token inválido o expirado`);
      client.emit('auth-error', { message: 'Token inválido o expirado' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Limpieza básica: si el doctor que se desconecta tenía una sala activa, la liberamos
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.doctorSocketId === client.id) {
        this.rooms.delete(roomId);
      }
    }
  }

  @SubscribeMessage('register-role')
  handleRegisterRole(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as AuthenticatedUser | undefined;
    if (!user) {
      client.emit('auth-error', { message: 'Debes iniciar sesión para unirte a la consulta' });
      return;
    }

    client.join(data.roomId);
    const room = this.rooms.get(data.roomId) ?? {};

    if (user.role === UserRole.DOCTOR) {
      room.doctorSocketId = client.id;
      this.rooms.set(data.roomId, room);
      if (room.waitingPatient) {
        client.emit('patient-waiting', room.waitingPatient);
      }
      console.log(`[AUDITORÍA] Doctor ${user.name} (CI ${user.ci}) entró a sala ${data.roomId}`);
    } else {
      room.waitingPatient = { socketId: client.id, name: user.name, ci: user.ci };
      this.rooms.set(data.roomId, room);
      if (room.doctorSocketId) {
        this.server.to(room.doctorSocketId).emit('patient-waiting', room.waitingPatient);
      }
      console.log(`[AUDITORÍA] Paciente ${user.name} (CI ${user.ci}) esperando en sala ${data.roomId}`);
    }
  }

  @SubscribeMessage('admit-patient')
  handleAdmitPatient(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as AuthenticatedUser | undefined;
    if (!user || user.role !== UserRole.DOCTOR) {
      client.emit('auth-error', { message: 'Solo un doctor autenticado puede admitir pacientes' });
      return;
    }

    const room = this.rooms.get(data.roomId);
    if (room?.waitingPatient) {
      this.server.to(room.waitingPatient.socketId).emit('call-admitted');
      client.emit('call-admitted');
      console.log(`[AUDITORÍA] Doctor admitió al paciente en sala ${data.roomId}`);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    // El client ya está en la sala desde 'register-role'; solo avisamos al otro lado
    client.to(roomId).emit('user-joined', client.id);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { roomId: string; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('offer', { offer: data.offer, from: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { roomId: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('answer', { answer: data.answer, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { roomId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('ice-candidate', { candidate: data.candidate, from: client.id });
  }

  @SubscribeMessage('end-call')
  handleEndCall(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('call-ended');
    this.rooms.delete(data.roomId);
    console.log(`[AUDITORÍA] Cliente ${client.id} colgó sala ${data.roomId}`);
  }

  //chat en llamada
  @SubscribeMessage('chat-message')
  handleChatMessage(
    @MessageBody() data: { roomId: string; sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = { sender: data.sender, text: data.text, timestamp: new Date().toISOString() };
    // Reenvía al resto de la sala (no de vuelta a quien lo envió)
    client.to(data.roomId).emit('chat-message', payload);
  }

  //soporte (canal anónimo, no requiere autenticación)
  @SubscribeMessage('register-contact')
  handleRegisterContact(
    @MessageBody() data: { roomId: string; name: string; ci: string; phone: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    // TODO: guardar este lead/contacto real en la base de datos (tabla de contactos, no de usuarios)
    console.log(`[AUDITORÍA-CONTACTO] ${data.name} (CI ${data.ci}, Tel ${data.phone}) inició chat de soporte en sala ${data.roomId}`);
  }

  @SubscribeMessage('support-message')
  handleSupportMessage(
    @MessageBody() data: { roomId: string; sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = { sender: data.sender, text: data.text, timestamp: new Date().toISOString() };
    client.to(data.roomId).emit('support-message', payload);
  }
}
