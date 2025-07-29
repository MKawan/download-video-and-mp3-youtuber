const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função melhorada para verificar o FFmpeg
async function verifyFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        console.log('✅ FFmpeg está instalado e acessível');
        return true;
    } catch (e) {
        console.error('❌ FFmpeg não está acessível:', e.message);
        return false;
    }
}

async function downloadMedia({ url, resolution = 'best', outputDir = './downloads', isPlaylist = false }) {
    try {
        // Verificação do FFmpeg
        if (!await verifyFFmpeg()) {
            throw new Error('FFmpeg é necessário para mesclar áudio e vídeo');
        }

        // Configurações básicas
        if (!url) throw new Error('URL não fornecida.');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`📂 Diretório criado: ${outputDir}`);
        }

        // Configuração de formatos simplificada
        const formatSelector = {
            '720p': 'bestvideo[height<=720]+bestaudio',
            'best': 'bestvideo+bestaudio'
        };

        const selectedFormat = formatSelector[resolution] || formatSelector['best'];
        console.log(`⚙️ Configuração selecionada: ${selectedFormat}`);

        // Opções otimizadas
        const options = {
            output: path.join(outputDir, '%(title)s.%(ext)s'),
            format: selectedFormat,
            mergeOutputFormat: 'mp4',
            noCheckCertificates: true,
            noWarnings: true,
            verbose: true,
            retries: 3,
            fragmentRetries: 3,
            preferFfmpeg: true,
            postprocessorArgs: 'ffmpeg:-c copy',
            noOverwrites: true
        };

        // Configurações para playlists
        if (isPlaylist || url.includes('list=')) {
            options.output = path.join(outputDir, '%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s');
            options.continue = true;
            options.breakOnExisting = true;
            console.log('🎵 Modo playlist ativado');
        }

        console.log(`⬇️ Iniciando download: ${url}`);
        
        // Versão corrigida do tratamento do processo
        const process = youtubedl.exec(url, options);
        
        // Tratamento de eventos corrigido
        if (process.stdout) {
            process.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('[download]') || output.includes('[ffmpeg]')) {
                    process.stdout.write(output);
                }
            });
        }
        
        if (process.stderr) {
            process.stderr.on('data', (data) => {
                process.stderr.write(data.toString());
            });
        }

        await new Promise((resolve, reject) => {
            process.on('close', (code) => {
                if (code === 0) {
                    console.log(`\n✅ Download concluído: ${outputDir}`);
                    resolve();
                } else {
                    reject(new Error(`Processo terminou com código ${code}`));
                }
            });
            
            process.on('error', (err) => {
                reject(err);
            });
        });

    } catch (error) {
        if (error.message.includes('aborted')) {
            console.log('\n🛑 Download interrompido pelo usuário');
        } else {
            console.error('\n❌ Erro durante o download:', error.message);
        }
        throw error;
    }
}

// Exemplo de uso
async function main() {
    try {
        await downloadMedia({
            url: 'https://www.youtube.com/playlist?list=PLvnDcR9zJ3ToYT9CcWdY3hNuBh4FY99J5',
            resolution: '360p',
            outputDir: '/home/mk/Downloads/minha_playlist',
            isPlaylist: true
        });
    } catch (error) {
        console.error('Falha na execução:', error);
    }
}

main();