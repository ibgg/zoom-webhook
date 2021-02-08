# Zoom2Vimeo Webhook en AWS

Este repositorio configura la infraestructura para un Webhook en AWS a través de Shell y utiliza algunas funciones lambda para subir los videos asociados a un grupo de cuentas de Zoom, hacia una cuenta de Vimeo. 
El siguiente diagrama muestra una descripción general del funcionamiento
![Zoom2Vimeo AWS Webhook](diagrams/Zoom2Vimeo-Webhook.jpg?raw=true "Zoom2Vimeo AWS Webhook")

## Prerequisitos
* Cuenta Pro de Zoom
* Cuenta Pro de Vimeo
* Aplicación Zoom
* Aplicación Vimeo
* Habilitar Webhook con evento de grabación completada
* Los videos en Zoom deben poder descargarse.

### CONFIG: Archivo
USERID="AWS User ID"
VERIFICATION_TOKEN="Zoom Verification Token"
ZOOM_TOKEN="Zoom JWT Token"
VIMEO_TOKEN="Vimeo Token"
VIMEO_USER_ID="Vimeo User ID"
VIMEO_PRESET_ID="Vimeo Preset ID"

## Configuración de Webhook en Zoom
Es necesario configurar el Webhook en la cuenta de zoom: https://marketplace.zoom.us/docs/api-reference/webhook-reference

## Setup.sh
Este script creará la siguiente configuración en la cuenta de AWS:
* Creación de un rol para las funciones lambda y asignación de permisos
* Creación de función lambda para autorización
* Creación de función lambda dispatcher
* Creación de función lambda para subir videos de Zoom a Vimeo
* Asignación de variables de entorno a funciones lambda
* Creación de REST Gateway
* Creación de método POST
* Configuración de invocación de función lambda desde API Gateway

Otorgar permisos de ejecución al script:
`$chmod +x setup.sh`
`./setup.sh`

## Prueba
Una vez terminada la ejecución del script, es posible invocar el método POST con la url generada por el script al final. La petición se puede hacer desde Postman o CURL (o cualquier cliente REST), de la siguiente forma:

```
curl -X POST \
  https://3u98xsn0zb.execute-api.us-east-1.amazonaws.com/prod/zoom-webhook \
  -H 'Authorization: PUT HERE YOUR VERIFICATION_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: ba52d5c8-ac37-47dc-b1d9-28696513c97b' \
  -H 'cache-control: no-cache' \
  -d '{
    "event": "recording.completed",
    "event_ts": 1234566789900,
    "payload": {
        "account_id": "lAAAAAAAAAAAAA",
        "object": {
            "uuid": "put here your uuid",
            "id": 12345,
            "host_id": "YOUR HOST ID",
            "topic": "A test meeting",
            "type": 2,
            "start_time": "2019-07-11T20:00:00Z",
            "duration": 1,
            "timezone": "America/Los_Angeles",
            "host_email": "somemeail@someemailservice.fjdjf",
            "total_size": 529758,
            "recording_count": 1,
            "share_url": "https://zoom.us/recording/share/aaaaaannnnnldglrkgmrmhh",
            "recording_files": [
                {
                    "id": "put here the record id",
                    "meeting_id": "YOUR MEETING ID",
                    "recording_start": "2019-07-23T22:14:57Z",
                    "recording_end": "2019-07-23T22:15:41Z",
                    "file_type": "MP4",
                    "file_size": 13750095,
                    "play_url": "PUT ONE PLAY URL",
                    "download_url": "PUT ONE DOWNLOAD URL",
                    "status": "completed",
                    "recording_type": "shared_screen_with_speaker_view"
                },
{
                    "id": "put here the record id",
                    "meeting_id": "YOUR MEETING ID",
                    "recording_start": "2019-07-23T22:14:57Z",
                    "recording_end": "2019-07-23T22:15:41Z",
                    "file_type": "MP4",
                    "file_size": 13750095,
                    "play_url": "PUT ONE PLAY URL",
                    "download_url": "PUT ONE DOWNLOAD URL",
                    "status": "completed",
                    "recording_type": "shared_screen_with_speaker_view"
                }
            ]
        }
    }
}'
```

## Links de documentación oficial
* https://marketplace.zoom.us/docs/api-reference/webhook-reference
* https://marketplace.zoom.us/docs/guides
* https://marketplace.zoom.us/docs/api-reference/introduction
* https://marketplace.zoom.us/docs/api-reference/zoom-api/users/users
* https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetings
* https://developer.vimeo.com/api/guides/start
* https://developer.vimeo.com/api/reference/folders
* https://developer.vimeo.com/api/reference/videos#uploads
* https://developer.vimeo.com/api/reference/embed-presets
