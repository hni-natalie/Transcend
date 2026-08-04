const prisma = require('../../prisma/client');
const { RecordingStatus } = require('@prisma/client');
const { getIO } = require("../services/socket.service");

const {
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    LIVEKIT_URL,
    SUPABASE_S3_ACCESS_KEY,
    SUPABASE_S3_SECRET_KEY,
    SUPABASE_S3_ENDPOINT,
    SUPABASE_S3_BUCKET,
    SUPABASE_S3_REGION,
    SUPABASE_PUBLIC_URL,
} = require('../utils/secrets');

const {
    EgressClient,
    EncodedFileOutput,
    S3Upload,
    EgressStatus,
} = require('livekit-server-sdk');


const egressClient = new EgressClient(
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
);

const PUBLIC_URL =
    `${SUPABASE_PUBLIC_URL}/${SUPABASE_S3_BUCKET}`;


function mapEgressStatus(status) {
    switch (status) {
        case EgressStatus.EGRESS_STARTING:
            return RecordingStatus.starting;

        case EgressStatus.EGRESS_ACTIVE:
            return RecordingStatus.active;

        case EgressStatus.EGRESS_ENDING:
            return RecordingStatus.stopped;

        case EgressStatus.EGRESS_COMPLETE:
            return RecordingStatus.completed;

        case EgressStatus.EGRESS_FAILED:
        case EgressStatus.EGRESS_ABORTED:
            return RecordingStatus.failed;

        default:
            return RecordingStatus.failed;
    }
}


const recordingService = {

    async startRecording(meetId) {
        const existing = await prisma.recording.findFirst({
            where: {
                meetId,
                status: {
                    in: [
                        RecordingStatus.starting,
                        RecordingStatus.active,
                    ],
                },
            },
        });

        if (existing) {
            throw new Error(
                'Recording is already running for this meeting.'
            );
        }

        const filename = `${meetId}-${Date.now()}.mp4`;

        const output = new EncodedFileOutput({
            filepath: filename,
            output: {
                case: 's3',
                value: new S3Upload({
                    accessKey: SUPABASE_S3_ACCESS_KEY,
                    secret: SUPABASE_S3_SECRET_KEY,
                    region: SUPABASE_S3_REGION,
                    bucket: SUPABASE_S3_BUCKET,
                    endpoint: SUPABASE_S3_ENDPOINT,
                    forcePathStyle: true,
                }),
            },
        });

        console.log('Starting LiveKit Egress...');

        const egress =
            await egressClient.startRoomCompositeEgress(
                meetId,
                output,
                { layout: 'grid' }
            );

        return prisma.recording.create({
            data: {
                meetId,
                egressId: egress.egressId,
                filename,
                status: RecordingStatus.starting,
            },
        });
    },


    async stopRecording(meetId) {
        const recording =
            await prisma.recording.findFirst({
                where: {
                    meetId,
                    status: {
                        in: [
                            RecordingStatus.starting,
                            RecordingStatus.active,
                        ],
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

        if (!recording) {
            throw new Error(
                'No active recording found.'
            );
        }

        await egressClient.stopEgress(recording.egressId);

        await prisma.recording.update({
            where: {
                recordingId: recording.recordingId,
            },
            data: {
                status: RecordingStatus.stopped,
            },
        });

        return recording;
    },


    async finalizeRecordings() {
        const recordings =
            await prisma.recording.findMany({
                where: {
                    status: {
                        in: [
                            RecordingStatus.starting,
                            RecordingStatus.active,
                            RecordingStatus.stopped,
                        ],
                    },
                },
            });

        for (const recording of recordings) {
            const list =
                await egressClient.listEgress({
                    egressId: recording.egressId,
                });

            const egress = list[0];

            if (!egress) {
                continue;
            }

            const status =
                mapEgressStatus(egress.status);

            console.log('==============================');
            console.log('Recording ID:', recording.recordingId);
            console.log('Egress ID:', recording.egressId);
            console.log('Status:', egress.status);
            console.log('Error:', egress.error);
            console.log('Egress Info:', JSON.stringify(egress, null, 2));
            console.log('==============================');

            const updateData = { status, };

            if (status === RecordingStatus.completed) {
                updateData.fileUrl =
                    `${PUBLIC_URL}/${recording.filename}`;
            }

            const updatedRecording =
                await prisma.recording.update({
                    where: {
                        recordingId: recording.recordingId,
                    },
                    data: updateData,
                });

            getIO().emit(
                "recordingUpdated",
                {
                    meetId: updatedRecording.meetId,
                    recording: updatedRecording
                }
            );
        }
    },

    async getRecordings(meetId) {
        return prisma.recording.findMany({
            where: {
                meetId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                recordingId: true,
                meetId: true,
                status: true,
                fileUrl: true,
                createdAt: true,
            },
        });
    }

};


module.exports = recordingService;