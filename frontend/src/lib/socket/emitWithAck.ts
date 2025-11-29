// lib/socket/emitWithAck.ts
import type {TypedSocket} from '@/lib/socket';
import type {SocketResponse} from '@/lib/socket';

export function emitWithAck<Payload, Result>(
    socket: TypedSocket | null,
    event: string,
    payload: Payload
): Promise<Result> {
    return new Promise((resolve, reject) => {
        if (!socket) {
            reject(new Error('Socket is not connected'));
            return;
        }

        socket.emit(event as any, payload, (response: SocketResponse<Result>) => {
            if (!response) {
                reject(new Error('No response from server'));
                return;
            }

            if (response.success) {
                // @ts-expect-error data may be undefined depending on the event
                resolve(response.data);
            } else {
                reject(new Error(response.error || 'Unknown socket error'));
            }
        });
    });
}
