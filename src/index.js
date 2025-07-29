const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

async function downloadMedia({ url, resolution = 'best', outputDir = './downloads', isPlaylist = false }) {
    try {
        // Validações iniciais
        if (!url) throw new Error('URL não fornecida.');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Diretório criado: ${outputDir}`);
        }

        // Mapeamento de resoluções para formatos do yt-dlp
        const resolutionMap = {
            '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/mp4',
            '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4',
            '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/mp4',
            'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4'
        };

        const selectedFormat = resolutionMap[resolution] || resolutionMap['best'];
        console.log(`Resolução selecionada: ${resolution}`);

        // Configurações comuns do yt-dlp
        const options = {
            output: path.join(outputDir, '%(title)s.%(ext)s'), // Nome do arquivo baseado no título
            format: selectedFormat,
            noCheckCertificates: true,
            noWarnings: true,
        };

        // Adiciona opções específicas para playlists
        if (isPlaylist) {
            options.extractFlat = false; // Baixa todos os vídeos da playlist
            options.output = path.join(outputDir, '%(playlist)s/%(title)s.%(ext)s'); // Organiza por playlist
        }

        // Verifica se é uma playlist
        const isPlaylistUrl = url.includes('list=');
        if (isPlaylistUrl && !isPlaylist) {
            console.log('URL detectada como playlist. Ajustando configurações...');
            options.extractFlat = false;
            options.output = path.join(outputDir, '%(playlist)s/%(title)s.%(ext)s');
        }

        // Executa o download
        console.log(`Iniciando download para: ${url}`);
        await youtubedl(url, options);
        console.log(`Download concluído com sucesso! Arquivo(s) salvo(s) em: ${outputDir}`);

    } catch (error) {
        console.error('Erro ao baixar o vídeo/playlist:', error.message);
    }
}

// Exemplo de uso
async function main() {
    // Exemplo 1: Baixar um vídeo individual em 720p
    await downloadMedia({
        url: 'https://youtu.be/givzBghS-LY',
        resolution: '1080p',
        outputDir: './downloads/videos',
        isPlaylist: false
    });

    // Exemplo 2: Baixar uma playlist em 1080p
    // await downloadMedia({
    //     url: 'https://www.youtube.com/playlist?list=PL6n9fhu94yhXbPWsA2OmwtH3T1qrj5ZOj',
    //     resolution: '1080p',
    //     outputDir: './downloads/playlists',
    //     isPlaylist: true
    // });
}

main();