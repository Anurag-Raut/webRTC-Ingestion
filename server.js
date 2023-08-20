const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const wrtc = require('wrtc');
const io=require('socket.io-client');
const { exec } = require('child_process');
const { Readable } = require('stream');



const socket=io.connect('http://localhost:3000')

let peerConnection;
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

let dataChannel;
let remoteChannel;



socket.on('offer', async offer => {
    try {
        // peerConnection = createPeerConnection();

        const remoteDescription = new wrtc.RTCSessionDescription(offer);
        await peerConnection.setRemoteDescription(remoteDescription);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', answer);
    } catch (error) {
        console.error('Error answering call:', error);
    }
});

socket.on('answer', async answer => {
    try {
        const remoteDescription = new wrtc.RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDescription);
    } catch (error) {
        console.error('Error handling answer:', error);
    }
});

socket.on('ice-candidate', async (candidate) => {
    try {
        if (candidate) {
            // console.log('Adding ice candidate:', candidate);
            await peerConnection?.addIceCandidate(candidate);
        }
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
    }
});

const rtmpUrl='rtmp://localhost:1935/live/test'


const ffmpegCommand = [
    'ffmpeg',
    '-i', 'pipe:0',  // Audio input via pipe
    // '-i', 'pipe:0',  // Video input via pipe
    // '-c:a', 'aac',
    '-c:v', 'libx264',
    // '-b:a', '128k',
    // '-preset', 'ultrafast',
    '-f', 'flv',
    rtmpUrl
  ];
  
  
  
  
  


async function init(){
    const readableStream = new Readable();

    const ffmpegProcess = exec(ffmpegCommand.join(' '), (error, stdout, stderr) => {
        if (error) {
          console.error('FFmpeg error:', error);
        }
        console.log('FFmpeg stderr:', stderr);
      });
    


     peerConnection =new wrtc.RTCPeerConnection(configuration);
     

    peerConnection.onicecandidate = (event) => {
        if(event.candidate){
            socket.emit('ice-candidate', event.candidate);
        }
    }
    // dataChannel = peerConnection.createDataChannel('chat');
    // dataChannel.onmessage = handleMessageReceived;
    readableStream._read = () => {};
    readableStream.pipe(ffmpegProcess.stdin);
    peerConnection.addEventListener('datachannel', event => {
        console.log('Data channel received:', event.channel);
        remoteChannel = event.channel;
        remoteChannel?.addEventListener('message', event => {
            const message = event.data;
            const mimeType = 'video/x-matroska;codecs=avc1,opus';
          
            // var blob = new Blob([message], { type: mimeType });
            const dataObject =new Buffer.from(message)
    
            console.log('Received message:', dataObject);
            readableStream.push(dataObject);
            // ffmpegProcess.stdin.write(dataObject);
        });
       
        });

    peerConnection.ontrack = (event) => {
       console.log(event.streams[0]);
    }


    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', offer);

  

   



}


function handleMessageReceived(event) {
    const receivedMessage = event.data;
    console.log('Received message:', receivedMessage);
}

init()