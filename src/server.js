const express = require('express');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function downloadMedia({ url, resolution = 'best', outputDir = './downloads', isPlaylist = false }) {
    try {
        if (!url) throw new Error('URL não fornecida.');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const resolutionMap = {
            '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/mp4',
            '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4',
            '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/mp4',
            'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4'
        };

        const selectedFormat = resolutionMap[resolution] || resolutionMap['best'];

        const options = {
            output: path.join(outputDir, '%(title)s.%(ext)s'),
            format: selectedFormat,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            retries: 10,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        };

        if (isPlaylist || url.includes('list=')) {
            options.output = path.join(outputDir, '%(playlist)s/%(title)s.%(ext)s');
        }

        await youtubedl(url, options);
        return { message: `Download concluído! Arquivo(s) salvo(s) em: ${outputDir}` };
    } catch (error) {
        throw new Error(`Erro ao baixar: ${error.message}`);
    }
}

app.post('/download', async (req, res) => {
    const { url, resolution, isPlaylist } = req.body;
    try {
        const result = await downloadMedia({ url, resolution, outputDir: './downloads', isPlaylist });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));