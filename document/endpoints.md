# Uta Medic Backend - Endpoints

Base URL local:

```text
http://localhost:3000
```

Si ejecutas el backend en otro puerto, cambia la variable `baseUrl` en Postman.

## GET /

Endpoint de prueba que ya venia en el proyecto.

### Request

```http
GET http://localhost:3000/
```

### Response 200

```text
Hello World!
```

## POST /doctor-ai/analyze

Genera un analisis clinico orientativo para un paciente usando:

- contexto clinico autorizado desde Azure SQL
- asignacion medico-paciente
- agente medico de Microsoft Foundry / Azure AI Projects

### Importante sobre autenticacion

El controlador espera encontrar el medico autenticado en:

```ts
request.user.sub
```

En la implementacion actual no se dejo un UUID hardcodeado de prueba. Por eso, si todavia no tienes un guard/middleware JWT que cargue `request.user`, este endpoint respondera:

```json
{
  "message": "No se encontro el medico autenticado.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Cuando conectes tu autenticacion real, envia el token desde Postman en `Authorization: Bearer <token>`.

### Modo temporal para pruebas en Postman

Mientras no tengas JWT/guards conectados, puedes activar un header de desarrollo.

Agrega esto a tu `.env`:

```env
DEV_AUTH_DOCTOR_HEADER_ENABLED=true
```

Luego envia este header en Postman:

```http
x-doctor-user-id: <doctorUserId>
```

El `doctorUserId` es el `Users.id` del medico, que corresponde a `Doctors.user_id`.

Consulta SQL para encontrarlo:

```sql
SELECT
    doctor.user_id AS doctorUserId,
    doctor.id AS doctorId,
    doctor.first_name,
    doctor.last_name,
    users.email
FROM dbo.Doctors AS doctor
INNER JOIN dbo.Users AS users
    ON users.id = doctor.user_id
ORDER BY doctor.last_name, doctor.first_name;
```

Ejemplo:

```http
x-doctor-user-id: 00000000-0000-0000-0000-000000000000
```

No uses este modo en produccion. Es solo para pruebas locales hasta conectar la autenticacion real.

## GET /doctor-ai/patients

Devuelve la lista de pacientes activos asignados al medico autenticado. Usa este endpoint para obtener el `patientId` que luego necesitas en `POST /doctor-ai/analyze`.

### Request

```http
GET http://localhost:3000/doctor-ai/patients
Authorization: Bearer <token>
x-doctor-user-id: <doctorUserId>
```

### Response 200

```json
{
  "count": 2,
  "patients": [
    {
      "patientId": "11111111-1111-1111-1111-111111111111",
      "firstName": "Ana",
      "lastName": "Quispe Flores",
      "fullName": "Ana Quispe Flores",
      "approximateAge": 34,
      "sex": "F",
      "bloodType": "O+",
      "documentCode": "DEMO-CI-001",
      "phone": "70000001",
      "assignedAt": "2026-07-17T03:30:00.000Z",
      "lastEncounter": {
        "reason": "Dolor abdominal",
        "status": "OPEN",
        "startedAt": "2026-07-17T03:30:00.000Z"
      }
    }
  ]
}
```

### Response 401 - Sin medico autenticado

```json
{
  "message": "No se encontro el medico autenticado.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Request

```http
POST http://localhost:3000/doctor-ai/analyze
Content-Type: application/json
Authorization: Bearer <token>
x-doctor-user-id: <doctorUserId>
```

### Body

```json
{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "question": "Resume los hallazgos principales y sugiere posibles diagnosticos diferenciales."
}
```

### Validaciones

`patientId`
: Debe ser UUID.

`question`
: Debe ser texto entre 5 y 1000 caracteres.

El `ValidationPipe` global esta activo con:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Si envias campos extra, Nest respondera error `400`.

### Response 200

```json
{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "answer": "Texto generado por el agente medico...",
  "generatedAt": "2026-07-17T03:20:00.000Z",
  "disclaimer": "Resultado orientativo sujeto a revision del medico responsable."
}
```

### Response 400 - Body invalido

Ejemplo cuando `patientId` no es UUID:

```json
{
  "message": ["patientId must be a UUID"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Response 401 - Sin medico autenticado

```json
{
  "message": "No se encontro el medico autenticado.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Response 403 - Medico sin acceso al paciente

```json
{
  "message": "El medico no tiene acceso autorizado a este paciente.",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Response 404 - Paciente no existe

```json
{
  "message": "El paciente no existe.",
  "error": "Not Found",
  "statusCode": 404
}
```

### Response 500 - SQL o Foundry

Puede ocurrir si falla la conexion a Azure SQL o si el agente de Foundry no responde.

```json
{
  "message": "No se pudo generar el analisis clinico.",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

## Variables de entorno necesarias

El backend necesita estas variables en `.env`:

```env
DB_SERVER=
DB_DATABASE=
DB_USER=
DB_PASSWORD=
DB_PORT=1433

AZURE_AI_PROJECT_ENDPOINT=
AZURE_AI_AGENT_NAME=
PORT=3000

# Solo para pruebas locales sin JWT real.
DEV_AUTH_DOCTOR_HEADER_ENABLED=false

# Solo para pruebas locales sin credenciales Azure/Foundry reales.
FOUNDRY_MOCK_ENABLED=false
```

Tambien debes tener credenciales Azure disponibles para `DefaultAzureCredential` si `FOUNDRY_MOCK_ENABLED=false`, por ejemplo con Azure CLI, Visual Studio Code, variables de entorno de service principal, o identidad administrada.

El backend llama al agente de Foundry con `responses.create()` usando `body.agent_reference.type` y `body.agent_reference.name`.

### Probar sin credenciales Azure

Si solo quieres probar Postman, SQL y el flujo completo del endpoint, usa:

```env
FOUNDRY_MOCK_ENABLED=true
```

Con eso `POST /doctor-ai/analyze` no llama al agente real de Foundry y devuelve una respuesta simulada. Para usar el agente real, cambia:

```env
FOUNDRY_MOCK_ENABLED=false
```

Y configura una de estas opciones:

- iniciar sesion con Azure CLI (`az login`)
- iniciar sesion con VS Code Azure extension
- variables de service principal: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`

## Como probar en Postman

1. Ejecuta el backend:

```bash
npm run start:dev
```

2. Importa el archivo:

```text
document/uta-medic.postman_collection.json
```

3. Edita las variables de la coleccion:

- `baseUrl`: `http://localhost:3000`
- `doctorUserId`: UUID real del usuario medico (`Doctors.user_id`)
- `patientId`: UUID real de un paciente
- `bearerToken`: token JWT real cuando tengas auth conectada

4. Prueba primero `GET /`.

5. Prueba `GET /doctor-ai/patients` para obtener los `patientId`.

6. Copia un `patientId` en la variable `patientId` de Postman.

7. Prueba `POST /doctor-ai/analyze`.

Si aun no hay autenticacion real, el resultado esperado para `GET /doctor-ai/patients` y `POST /doctor-ai/analyze` es `401`.
