import { readAudioMetadata } from '../fileSystemUtils';
// Mock URL.createObjectURL
beforeAll(() => {
    Object.defineProperty(global, 'URL', {
        value: {
            createObjectURL: jest.fn(() => 'blob:mock-object-url'),
            revokeObjectURL: jest.fn(),
        },
    });
});

import * as musicMetadata from 'music-metadata-browser';

// Mock music-metadata-browser
jest.mock('music-metadata-browser', () => ({
    parseBlob: jest.fn((file: File) => {
        if (file.name === 'track_with_cover.aiff') {
            return Promise.resolve({
                common: {
                    title: 'Test Track',
                    artist: 'Test Artist',
                    album: 'Test Album',
                    picture: [{
                        format: 'image/jpeg',
                        data: Buffer.from('fake_image_data'),
                        description: 'Cover Art'
                    }]
                },
                format: {
                    duration: 180
                }
            });
        } else if (file.name === 'track_no_cover.aiff') {
            return Promise.resolve({
                common: {
                    title: 'No Cover Track',
                    artist: 'No Cover Artist',
                    album: 'No Cover Album',
                    picture: []
                },
                format: {
                    duration: 200
                }
            });
        }
        return Promise.resolve({
            common: {},
            format: {}
        });
    }),
}));

describe('readAudioMetadata', () => {
    it('should extract metadata and cover art when available', async () => {
        const mockFile = new File([''], 'track_with_cover.aiff', { type: 'audio/aiff' });
        const metadata = await readAudioMetadata(mockFile);

        expect(metadata.title).toBe('Test Track');
        expect(metadata.artist).toBe('Test Artist');
        expect(metadata.album).toBe('Test Album');
        expect(metadata.duration).toBe(180);
        expect(metadata.coverArt).toBeDefined();
        expect(metadata.coverArt).toMatch(/^blob:/); // Expect a blob URL
    });

    it('should extract metadata but no cover art when not available', async () => {
        const mockFile = new File([''], 'track_no_cover.aiff', { type: 'audio/aiff' });
        const metadata = await readAudioMetadata(mockFile);

        expect(metadata.title).toBe('No Cover Track');
        expect(metadata.artist).toBe('No Cover Artist');
        expect(metadata.album).toBe('No Cover Album');
        expect(metadata.duration).toBe(200);
        expect(metadata.coverArt).toBeNull();
    });

    it('should handle errors during metadata extraction gracefully', async () => {
        // Mock parseBlob to throw an error
        (musicMetadata.parseBlob as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Parsing error');
        });

        const mockFile = new File([''], 'corrupt_track.aiff', { type: 'audio/aiff' });
        const metadata = await readAudioMetadata(mockFile);

        expect(metadata.title).toBe('corrupt_track.aiff');
        expect(metadata.artist).toBe('Unknown Artist');
        expect(metadata.album).toBe('Unknown Album');
        expect(metadata.duration).toBe(0);
        expect(metadata.coverArt).toBeNull();
    });
});