# Uta Medic Backend - Endpoints y Pruebas

Base URL local:

```text
http://localhost:3000
```

Si usas otro puerto, cambia la variable `baseUrl` en Postman.

## Cambios Implementados

- Se activo `ConfigModule` global.
- Se agrego conexion global a Azure SQL con `SqlService`.
- Se agrego `GET /doctor-ai/patients` para listar pacientes asignados al medico.
- Se agrego `POST /doctor-ai/analyze` para analizar un paciente con contexto clinico autorizado.
- Se agrego modo temporal de pruebas con header `x-doctor-user-id`.
- Se agrego modo mock de Foundry con `FOUNDRY_MOCK_ENABLED`.
- Se actualizo la llamada real a Foundry para usar `body.agent_reference.type` y `body.agent_reference.name`.
- Se activo validacion global con `ValidationPipe`.

## Autenticacion Para Pruebas

En produccion, el backend espera que un guard JWT cargue:

```ts
request.user.sub
```

Ese `sub` debe ser el `Users.id` del medico, equivalente a:

```text
Doctors.user_id
```

Como aun estas probando sin JWT real, usa este modo temporal.

### .env Para Pruebas Locales

```env
DEV_AUTH_DOCTOR_HEADER_ENABLED=true
```

Luego envia este header en Postman:

```http
x-doctor-user-id: <doctorUserId>
```

No necesitas enviar `Authorization: Bearer <token>` mientras uses este modo.

### Obtener doctorUserId

Ejecuta esta consulta en Azure SQL:

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

## Foundry

Para usar el agente real:

```env
FOUNDRY_MOCK_ENABLED=false
```

Debes tener sesion Azure disponible para `DefaultAzureCredential`, por ejemplo con:

```bash
az login
```

Para probar sin llamar a Foundry:

```env
FOUNDRY_MOCK_ENABLED=true
```

Con mock activo, `POST /doctor-ai/analyze` devuelve una respuesta simulada.

El payload real hacia Foundry usa:

```ts
body: {
  agent_reference: {
    type: 'agent_reference',
    name: AZURE_AI_AGENT_NAME
  }
}
```

## GET /

Endpoint de prueba base.

### Request

```http
GET http://localhost:3000/
```

### Response 200

```text
Hello World!
```

## GET /doctor-ai/patients

Lista los pacientes activos asignados al medico autenticado. Este endpoint sirve para obtener el `patientId` que despues se usa en `POST /doctor-ai/analyze`.

### Request Para Pruebas Locales

```http
GET http://localhost:3000/doctor-ai/patients
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

### Errores

Sin `x-doctor-user-id` y sin JWT:

```json
{
  "message": "No se encontro el medico autenticado.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Con `x-doctor-user-id` mal escrito:

```json
{
  "message": "El header x-doctor-user-id debe ser un UUID valido.",
  "error": "Bad Request",
  "statusCode": 400
}
```

## POST /doctor-ai/analyze

Genera un analisis clinico orientativo para un paciente usando contexto autorizado desde SQL y el agente de Foundry.

### Request Para Pruebas Locales

```http
POST http://localhost:3000/doctor-ai/analyze
Content-Type: application/json
x-doctor-user-id: <doctorUserId>
```

### Body

```json
{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "question": "Resume los hallazgos principales y sugiere posibles diagnosticos diferenciales."
}
```

### Response 200

```json
{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "answer": "Texto generado por el agente medico...",
  "generatedAt": "2026-07-17T03:20:00.000Z",
  "disclaimer": "Resultado orientativo sujeto a revision del medico responsable."
}
```

### Validaciones

`patientId`
: Debe ser UUID.

`question`
: Debe ser texto entre 5 y 1000 caracteres.

Campos extra
: Se rechazan porque `forbidNonWhitelisted` esta activo.

### Errores

Body invalido:

```json
{
  "message": ["patientId must be a UUID"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Sin medico autenticado:

```json
{
  "message": "No se encontro el medico autenticado.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Paciente no asignado al medico:

```json
{
  "message": "El medico no tiene acceso autorizado a este paciente.",
  "error": "Forbidden",
  "statusCode": 403
}
```

Paciente inexistente:

```json
{
  "message": "El paciente no existe.",
  "error": "Not Found",
  "statusCode": 404
}
```

Credenciales Azure faltantes con `FOUNDRY_MOCK_ENABLED=false`:

```json
{
  "message": "No hay credenciales Azure disponibles para consultar Foundry. Para pruebas locales activa FOUNDRY_MOCK_ENABLED=true o configura Azure CLI / service principal.",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

Error general de Foundry:

```json
{
  "message": "No se pudo generar el analisis clinico.",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

## Variables .env

```env
DB_SERVER=
DB_DATABASE=
DB_USER=
DB_PASSWORD=
DB_PORT=1433

AZURE_AI_PROJECT_ENDPOINT=
AZURE_AI_AGENT_NAME=
PORT=3000

DEV_AUTH_DOCTOR_HEADER_ENABLED=true
FOUNDRY_MOCK_ENABLED=false
```

## Casos De Prueba

### Caso 1 - Health Check

Request:

```http
GET / 
```

Esperado:

```text
Hello World!
```

### Caso 2 - Listar Pacientes Del Medico

Request:

```http
GET /doctor-ai/patients
x-doctor-user-id: <doctorUserId valido>
```

Esperado:

```json
{
  "count": 1,
  "patients": [
    {
      "patientId": "uuid-del-paciente"
    }
  ]
}
```

Usa el `patientId` de esta respuesta para el caso 3.

### Caso 3 - Analizar Paciente Con Foundry Real

Precondicion:

```env
FOUNDRY_MOCK_ENABLED=false
```

Y tener sesion Azure activa:

```bash
az login
```

Request:

```http
POST /doctor-ai/analyze
Content-Type: application/json
x-doctor-user-id: <doctorUserId valido>
```

Body:

```json
{
  "patientId": "<patientId obtenido del caso 2>",
  "question": "Resume el caso clinico y dame posibles diagnosticos diferenciales."
}
```

Esperado:

```json
{
  "patientId": "<patientId>",
  "answer": "respuesta del agente",
  "generatedAt": "fecha ISO",
  "disclaimer": "Resultado orientativo sujeto a revision del medico responsable."
}
```

### Caso 4 - Analizar Paciente Con Mock

Precondicion:

```env
FOUNDRY_MOCK_ENABLED=true
```

Esperado:

```json
{
  "answer": "Respuesta simulada del agente medico para pruebas locales..."
}
```

### Caso 5 - Header De Medico Faltante

Request:

```http
GET /doctor-ai/patients
```

Esperado:

```json
{
  "statusCode": 401
}
```

### Caso 6 - Header De Medico Invalido

Request:

```http
GET /doctor-ai/patients
x-doctor-user-id: abc
```

Esperado:

```json
{
  "statusCode": 400
}
```

### Caso 7 - Body Invalido

Request:

```http
POST /doctor-ai/analyze
x-doctor-user-id: <doctorUserId valido>
```

Body:

```json
{
  "patientId": "no-es-uuid",
  "question": "ok"
}
```

Esperado:

```json
{
  "statusCode": 400
}
```

## Flujo Recomendado En Postman

1. Importa:

```text
document/uta-medic.postman_collection.json
```

2. Configura variables:

- `baseUrl`: `http://localhost:3000`
- `doctorUserId`: valor real de `Doctors.user_id`
- `patientId`: se llena despues de llamar `GET /doctor-ai/patients`

3. Ejecuta `Health - GET /`.

4. Ejecuta `Doctor AI - List My Patients`.

5. Copia un `patientId` de la respuesta.

6. Ejecuta `Doctor AI - Analyze Patient`.
