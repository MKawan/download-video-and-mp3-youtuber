const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verifica se o FFmpeg está instalado (necessário para conversões)
function checkFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        console.error('❌ FFmpeg não encontrado. É necessário para conversões:');
        console.log('Instale com:');
        console.log('Linux: sudo apt-get install ffmpeg');
        console.log('Mac: brew install ffmpeg');
        console.log('Windows: choco install ffmpeg');
        return false;
    }
}

async function downloadMedia({ 
    url, 
    outputDir = './downloads',
    format = 'video', // 'video' ou 'mp3'
    resolution = '720p' // só aplicável quando format = 'video'
}) {
    try {
        if (!url) throw new Error('URL não fornecida.');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`📂 Diretório criado: ${outputDir}`);
        }

        // Configurações comuns
        const options = {
            output: path.join(outputDir, '%(title)s.%(ext)s'),
            noCheckCertificates: true,
            noWarnings: true,
            verbose: true,
            retries: 3
        };

        // Configurações específicas para MP3
        if (format === 'mp3') {
            if (!checkFFmpeg()) throw new Error('FFmpeg necessário para MP3');
            
            Object.assign(options, {
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: '0', // 0 = melhor qualidade
                embedThumbnail: true,
                addMetadata: true,
                postprocessorArgs: 'ffmpeg:-acodec libmp3lame -q:a 0'
            });
            
            console.log('🎵 Baixando como MP3 (melhor qualidade)');
        } 
        // Configurações para vídeo
        else {
            const formatMap = {
                '2160p': 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
                '1440p': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
                '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
                '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
                '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
                'best': 'bestvideo+bestaudio/best'
            };
            
            Object.assign(options, {
                format: formatMap[resolution] || formatMap['720p'],
                mergeOutputFormat: 'mp4',
                embedThumbnail: true,
                embedMetadata: true
            });
            
            console.log(`🎥 Baixando vídeo em ${resolution}`);
        }

        // Verifica se é playlist
        if (url.includes('list=')) {
            options.output = path.join(outputDir, '%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s');
            options.continue = true;
            console.log('🔢 Playlist detectada - organizando por pasta');
        }

        console.log(`⬇️ Iniciando download: ${url}`);
        
        // Executa o download
        const process = youtubedl.exec(url, options);
        
        // Mostra progresso
        process.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('[download]') || output.includes('[ffmpeg]')) {
                process.stdout.write(output);
            }
        });
        
        process.stderr.on('data', (data) => {
            const err = data.toString();
            if (!err.includes('WARNING:')) {
                process.stderr.write(err);
            }
        });

        await new Promise((resolve, reject) => {
            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Processo falhou com código ${code}`));
            });
            
            process.on('error', reject);
        });
        
        console.log(`✅ Download concluído em: ${outputDir}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    }
}

// Exemplos de uso:
async function main() {
    try {
        // Baixar vídeo em 720p
        await downloadMedia({
            url: 'https://youtu.be/7hDVL1vifc4',
            outputDir: './downloads/videos',
            format: 'video',
            resolution: '720p'
        });
        
        // // Baixar vídeo
        // await downloadMedia({
        //     url: 'https://www.youtube.com/playlist?list=PLzSbzd1_gUxTP0uStNorTSvkp8sTd0yjE',
        //     outputDir: './downloads/minha_playlist',
        //     format: 'video',
        //     resolution: '1080p'
        // });
        
        // await downloadMedia({
        //     url: 'https://youtu.be/UoJM48EhGsM',
        //     outputDir: './musicas',
        //     format: 'mp3'
        // });

        // Baixar playlist inteira como MP3
        
        // await downloadMedia({
        //     url: 'https://www.youtube.com/watch?v=bwGftC32wNw&list=RDkezf4Fo7B9M&index=2&ab_channel=Hungria',
        //     outputDir: './downloads/minha_playlist',
        //     format: 'mp3'
        // });
        
    } catch (error) {
        console.error('Falha na execução:', error);
    }
}

main();