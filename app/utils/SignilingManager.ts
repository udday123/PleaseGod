// singiling manager file-->>
import { Ticker } from "./types";
export const Base_Url="wss://ws.backpack.exchange/"

export class SinglingManager {
    
    private static instance:SinglingManager;
    private initialized:boolean = false;
    private ws:WebSocket;
    private buffered:any[] = [];
    private id:number = 1;
    private callbacks: { [type:string]:any[]} = {};

    private constructor(){
        this.ws = new WebSocket(Base_Url);
        this.init();
    }

    public static getInstance(): SinglingManager {
        if(!this.instance){
            this.instance = new SinglingManager();
        }
        return this.instance; 
    }

    init(){
        this.ws.onopen = () => {
            console.log("WebSocket connected successfully.");
            this.initialized = true;
            this.buffered.forEach((x:any)=>{
                this.ws.send(JSON.stringify(x))
            });
            this.buffered = [];
        }

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // console.log("SinglingManager received raw message:", message); // Keep this for overall message structure

            // --- IMPORTANT CHANGE HERE ---
            // The stream name is now in message.stream, not message.e
            // The actual payload is in message.data
            const stream:string = message?.stream; 
            const payload = message?.data; // Extract the actual data payload

            // Crucial check: If payload is null/undefined or doesn't have 'e', skip processing for specific streams
            if (!payload) {
                // console.warn("Received message with no data payload:", message);
                return; 
            }

            // Now, use payload.e to identify the event type
            const eventType:string = payload?.e; 
            
            if(eventType==="ticker"){
                if (this.callbacks["ticker"]?.length > 0) { // Use "ticker" string directly for callback map
                    this.callbacks["ticker"].forEach(({ callback }) => {
                        const newTicker: Partial<Ticker> = {
                            lastPrice: payload.c,
                            high: payload.h,
                            low: payload.l,
                            volume: payload.v,
                            quoteVolume: payload.V, 
                            symbol: payload.s,
                        };
                        callback(newTicker);
                    });
                }
            }
            else if(eventType==="depth"){
                if (this.callbacks["depth"]?.length > 0) { // Use "depth" string directly for callback map
                    this.callbacks["depth"].forEach(({callback})=>{
                        const bids = payload?.b ?? [];
                        const asks = payload?.a ?? [];
                        callback(bids, asks);
                    })
                }
            }
            // In SinglingManager.ts, within the kline block:
                    else if (eventType === "kline") {
                        if (this.callbacks["kline"]?.length > 0) {
                            this.callbacks["kline"].forEach(({ callback }) => {
                                // Add this specific log
                                console.log(`%c[SinglingManager Debug] Sending kline payload. 'T' type: ${typeof payload.T}, Value:`, 'color: pink;', payload.T);
                                callback(payload);
                            });
                        }
                    }
        }

        this.ws.onclose = (event) => {
            console.warn("WebSocket closed:", event);
            this.initialized = false;
        }

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        }
    }
    
    sendMessage(message:any){
        const messageToSend = {
            ...message,
            id:this.id++
        }
        if(!this.initialized || this.ws.readyState !== WebSocket.OPEN){
            this.buffered.push(messageToSend);
            console.log("WebSocket not open, buffering message:", messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
        console.log("WebSocket sent message:", messageToSend);
    }

    async registerCallback(stream: string, callback: any, id: string) {
        if (!this.callbacks[stream]) {
            this.callbacks[stream] = [];
        }
        if (!this.callbacks[stream].some(cb => cb.id === id)) {
            this.callbacks[stream].push({ callback, id });
            console.log(`Registered callback for stream '${stream}' with ID '${id}'.`);
        } else {
            // console.log(`Callback with ID '${id}' already registered for stream '${stream}'.`);
        }
    }
    
    async deRegisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const initialLength = this.callbacks[type].length;
            this.callbacks[type] = this.callbacks[type].filter((callback: { id: string; }) => callback.id !== id);
            if (this.callbacks[type].length < initialLength) {
                console.log(`De-registered callback for stream '${type}' with ID '${id}'.`);
            } else {
                // console.log(`No callback found for stream '${type}' with ID '${id}' to de-register.`);
            }
        }
    }
}