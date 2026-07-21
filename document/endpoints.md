# Uta Medic Backend - Endpoints y Pruebas

Base URL local:

```text
http://localhost:3000/api/v1
```

Si usas otro puerto, cambia la variable `baseUrl` en Postman.

## Cambios Implementados

- Se activo `ConfigModule` global.
- Se agrego conexion global a Supabase con `SupabaseService`.
- Se agrego `GET /doctor-ai/patients` para listar pacientes asignados al medico.
- Se agrego `POST /doctor-ai/analyze` para analizar un paciente con contexto clinico autorizado.
- Se agrego `POST /user-ai/chat` para consultas ciudadanas con el agente `agenteUtamedic`.
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

Ejecuta esta consulta en Supabase SQL Editor:

```sql
SELECT
    doctor.user_id AS "doctorUserId",
    doctor.id AS "doctorId",
    doctor.first_name,
    doctor.last_name,
    users.email
FROM doctors AS doctor
INNER JOIN users
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
    name: AZURE_AI_DOCTOR_AGENT_NAME | AZURE_AI_USER_AGENT_NAME
  }
}
```

Agentes configurados:

```env
AZURE_AI_DOCTOR_AGENT_NAME=agenteMedico
AZURE_AI_USER_AGENT_NAME=agenteUtamedic
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
GET http://localhost:3000/api/v1/doctor-ai/patients
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

Genera un analisis clinico orientativo para un paciente usando contexto autorizado desde Supabase y el agente medico de Foundry.

### Request Para Pruebas Locales

```http
POST http://localhost:3000/api/v1/doctor-ai/analyze
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
  "message": "No se pudo consultar el agente medico de Foundry. Revisa el endpoint, el nombre del agente y las credenciales Azure del backend.",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

## POST /user-ai/chat

Endpoint ciudadano para consultas generales de usuarios/pacientes. Usa el agente de Foundry `agenteUtamedic`.

Este endpoint no consulta Supabase ni otra base de datos desde el backend. Solo envia la consulta del usuario al agente de usuarios. Si el agente tiene herramientas conectadas en Foundry, esas herramientas se gestionan desde Foundry.

### Request

```http
POST http://localhost:3000/api/v1/user-ai/chat
Content-Type: application/json
```

### Body

Puedes enviar cualquiera de estos campos:

```json
{
  "message": "Que hospital cercano puedo buscar?",
  "location": "Sopocachi, La Paz, Bolivia"
}
```

Tambien acepta:

```json
{
  "query": "Busco un hospital cercano con emergencias"
}
```

o:

```json
{
  "consulta": "Necesito encontrar un centro medico cerca"
}
```

### Response 200

```json
{
  "answer": "Texto generado por el agente ciudadano...",
  "generatedAt": "2026-07-20T18:30:00.000Z",
  "disclaimer": "Orientacion general. No reemplaza una evaluacion medica profesional."
}
```

### Validaciones

`message`, `query` o `consulta`
: Debe ser texto entre 2 y 1000 caracteres.

`location`
: Opcional. Texto entre 2 y 300 caracteres. Recomendado para busquedas de centros cercanos.

Campos extra
: Se rechazan porque `forbidNonWhitelisted` esta activo.

Base de datos
: No requiere `patientId`, `doctorId`, header medico ni conexion a Supabase.

Busqueda web
: Para devolver centros reales, el agente `agenteUtamedic` debe tener la herramienta de busqueda web habilitada en Azure AI Foundry. Si la herramienta no esta habilitada o no devuelve datos confiables, el agente debe pedir mas ubicacion o responder que no puede confirmar centros reales.

### Errores

Body sin consulta:

```json
{
  "message": "Debes enviar message, query o consulta con la pregunta del usuario.",
  "error": "Bad Request",
  "statusCode": 400
}
```

Campo demasiado corto:

```json
{
  "message": ["message must be longer than or equal to 2 characters"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Credenciales Azure faltantes con `FOUNDRY_MOCK_ENABLED=false`:

```json
{
  "message": "No hay credenciales Azure disponibles para consultar el agente de usuarios.",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

Error general de Foundry:

```json
{
  "message": "No se pudo consultar el agente de usuarios. Revisa AZURE_AI_USER_AGENT_NAME, el endpoint y las credenciales Azure.",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

## Variables .env

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DB_REQUIRED=false
DB_CONNECT_RETRIES=3

AZURE_AI_PROJECT_ENDPOINT=
AZURE_AI_DOCTOR_AGENT_NAME=agenteMedico
AZURE_AI_USER_AGENT_NAME=agenteUtamedic
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

### Caso 6 - Consulta Ciudadana Con Agente Real

Precondicion:

```env
FOUNDRY_MOCK_ENABLED=false
AZURE_AI_USER_AGENT_NAME=agenteUtamedic
```

Request:

```http
POST /user-ai/chat
Content-Type: application/json
```

Body:

```json
{
  "message": "Necesito encontrar un hospital cercano.",
  "location": "Sopocachi, La Paz, Bolivia"
}
```

Esperado:

```json
{
  "answer": "respuesta del agente ciudadano",
  "generatedAt": "fecha ISO",
  "disclaimer": "Orientacion general. No reemplaza una evaluacion medica profesional."
}
```

### Caso 7 - Consulta Ciudadana Sin Body Valido

Request:

```http
POST /user-ai/chat
Content-Type: application/json
```

Body:

```json
{}
```

Esperado:

```json
{
  "statusCode": 400
}
```

### Caso 8 - Header De Medico Invalido

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

### Caso 9 - Body Invalido

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

- `baseUrl`: `http://localhost:3000/api/v1`
- `doctorUserId`: valor real de `Doctors.user_id`
- `patientId`: se llena despues de llamar `GET /doctor-ai/patients`

3. Ejecuta `Health - GET /`.

4. Ejecuta `Doctor AI - List My Patients`.

5. Copia un `patientId` de la respuesta.

6. Ejecuta `Doctor AI - Analyze Patient`.

7. Ejecuta `User AI - Chat` para probar el agente ciudadano.
