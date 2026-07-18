import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface WaitingPatient {
  socketId: string;
  name: string;
  ci: string;
}

interface RoomInfo {
  doctorSocketId?: string;
  waitingPatient?: WaitingPatient;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, RoomInfo>();

  @SubscribeMessage('register-role')
  handleRegisterRole(
    @MessageBody() data: { roomId: string; role: 'doctor' | 'paciente'; name: string; ci: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    const room = this.rooms.get(data.roomId) ?? {};

    if (data.role === 'doctor') {
      room.doctorSocketId = client.id;
      this.rooms.set(data.roomId, room);
      if (room.waitingPatient) {
        client.emit('patient-waiting', room.waitingPatient);
      }
      console.log(`[AUDITORÍA] Doctor ${data.name} (CI ${data.ci}) entró a sala ${data.roomId}`);
    } else {
      room.waitingPatient = { socketId: client.id, name: data.name, ci: data.ci };
      this.rooms.set(data.roomId, room);
      if (room.doctorSocketId) {
        this.server.to(room.doctorSocketId).emit('patient-waiting', room.waitingPatient);
      }
      console.log(`[AUDITORÍA] Paciente ${data.name} (CI ${data.ci}) esperando en sala ${data.roomId}`);
    }
  }

  @SubscribeMessage('admit-patient')
  handleAdmitPatient(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
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

  //soporte
  @SubscribeMessage('register-contact')
  handleRegisterContact(
    @MessageBody() data: { roomId: string; name: string; ci: string; phone: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    // TODO: cuando exista la base de datos, guardar este lead/contacto real
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
/*import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    client.to(roomId).emit('user-joined', client.id);

    // TODO: cuando exista la tabla de auditoría, reemplazar por un save() real
    console.log(`[AUDITORÍA] ${new Date().toISOString()} - Cliente ${client.id} se unió a sala ${roomId}`);
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
    client.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      from: client.id,
    });
  }

  @SubscribeMessage('end-call')
  handleEndCall(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('call-ended');
    console.log(`[AUDITORÍA] ${new Date().toISOString()} - Cliente ${client.id} colgó sala ${data.roomId}`);
  }
}*/