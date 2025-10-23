/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const {
   King,
   wtype,
   prefix,
   remini,
   upscaleImage,
   config,
   Baileys
} = require("../core")


const getImageUrl = async (m) => {
    if (m.quoted.image) {
        return await m.upload(await m.quoted.download(), "temp")
    } else if (m.quoted.sender) {
        return await m.client.profilePictureUrl(m.quoted.sender, 'image')
    }
    throw new Error("Aucune source d'image valide trouvée")
}

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

King({
        cmd: "remini|upscale|hd",
        desc: "améliorer la qualité d'une image (pixelcut)",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
      try {
        if (!(m.image || m.quoted.image)) return await m.send("_Répondez à une image_")
        await m.react("⏳")
        var mss = m.image ? m : m.quoted.image ? m.quoted : null
        var media = await m.client.downloadMediaMessage(m.image ? m : m.quoted.image ? m.quoted: null)
        var pic = await upscaleImage(media, mss.mtype)
        await m.react("✅")
        return await m.send(pic, { caption: "> Voici votre image améliorée.." }, "image")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
})


King({
        cmd: "gfx|gfx1",
        desc: "créer une image GFX",
        fromMe: wtype,
        type: "image"
}, async (m, text, c) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx Je Suis;King_`)
        var txt = text.split(";")
        if (!txt[0] || !txt[1]) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${c} Je Suis;King_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)

King({
        cmd: "gfx2",
        desc: "créer une image GFX2",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx2 Je Suis;King_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx2?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx3",
        desc: "créer une image GFX3",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx3 Je Suis;King_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx3?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx4",
        desc: "créer une image GFX4",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx4 Je Suis;King_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx4?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx5",
        desc: "créer une image GFX5 avec trois textes",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez trois textes*_\n_exemple: ${prefix}gfx5 Je Suis;King;Dev_`)
        var txt = text.split(";")
        if (txt.length < 3) return await m.send(`_*Fournissez les trois textes séparés par des points-virgules*_\n_exemple: ${prefix}gfx5 Je Suis;King;Dev_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx5?apikey=free_key@maher_apis&text1=${txt[0]}&text2=${txt[1]}&text3=${txt[2]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx6",
        desc: "créer une image GFX6 avec trois textes",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez trois textes*_\n_exemple: ${prefix}gfx6 Je Suis;King;Dev_`)
        var txt = text.split(";")
        if (txt.length < 3) return await m.send(`_*Fournissez les trois textes séparés par des points-virgules*_\n_exemple: ${prefix}gfx6 Je Suis;King;Dev_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx6?apikey=free_key@maher_apis&text1=${txt[0]}&text2=${txt[1]}&text3=${txt[2]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx7",
        desc: "créer une image GFX7",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx7 Je Suis;King_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx7?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx8",
        desc: "créer une image GFX8",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez deux textes*_\n_exemple: ${prefix}gfx8 Je Suis;King_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx8?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx9",
        desc: "créer une image GFX9 avec un seul texte",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez un texte*_\n_exemple: ${prefix}gfx9 King_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx9?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx10",
        desc: "créer une image GFX10 avec un seul texte",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez un texte*_\n_exemple: ${prefix}gfx10 King_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx10?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)

King({
        cmd: "gfx11",
        desc: "créer une image GFX11 avec un seul texte",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez un texte*_\n_exemple: ${prefix}gfx11 King_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx11?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)


King({
        cmd: "gfx12",
        desc: "créer une image GFX12 avec un seul texte",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*Fournissez un texte*_\n_exemple: ${prefix}gfx12 King_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx12?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)

King({
        cmd: "carbon",
        desc: "créer une image carbon à partir de code",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
        const codeText = m.quoted?.text || text
        
        if (!codeText) return await m.send(`_*Fournissez du code ou répondez à un message avec du code*_\n_exemple: ${prefix}carbon console.log("Hello World")_`)
        
        await m.react("⏳")
        await m.send(
                `https://api.nexoracle.com/image-creating/carbon-img?apikey=free_key@maher_apis&text=${encodeURIComponent(codeText)}`, 
                {caption: config().CAPTION}, 
                "image"
        )
        await m.react("✅")
        } catch (err) {
                console.error(err)
                return await m.send(`Erreur: ${err}`)
        }
}
)

King({
        cmd: "wanted",
        desc: "créer un avis de recherche de l'utilisateur ou de l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/wanted?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "wasted",
        desc: "créer un effet GTA wasted sur l'utilisateur ou l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/wasted?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "rainbow",
        desc: "appliquer un filtre arc-en-ciel à l'utilisateur ou à l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/rainbow?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "trigger-meme",
        desc: "créer un meme triggered de l'utilisateur ou de l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/trigger?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "rip-meme",
        desc: "créer un meme RIP de l'utilisateur ou de l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/rip?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "mnm",
        desc: "créer un effet bonbon M&M avec l'utilisateur ou l'image répondu",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/mnm?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "jail",
        desc: "mettre l'utilisateur ou l'image répondu derrière les barreaux",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/jail?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "invert",
        desc: "inverser les couleurs de l'utilisateur ou de l'image répondu",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/invert?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
  cmd: "naturewlp",
  desc: "envoie des diapositives de fonds d'écran nature",
  fromMe: wtype,
  type: "image",
}, async (m, text) => {
  try {
        const response = await m.axios(`https://kord-api.vercel.app/lumina/search?query=${text}`)
        const { wallpapers } = response
        const jid = m.chat
        const baileys = await Baileys()
        const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = baileys

        const slides = wallpapers.map(wallpaper => {
            const stats = `❐ ${wallpaper.downloads} ✰ ${wallpaper.likes} ✡ ${wallpaper.views}`;
            const details = `Résolution: ${wallpaper.resolution}\nTaille: ${formatFileSize(wallpaper.size * 1024)}`;
            
            return [
                wallpaper.thumbnail,
                `${text} fonds d'écran`,
                `${details}`,
                wallpaper.tags,
                'Télécharger',
                wallpaper.image,
                'cta_url',
                wallpaper.image
            ];
        });

        const cards = await Promise.all(
            slides.map(async ([image, titMess, boMessage, fooMess, textCommand, command, buttonType, url]) => ({
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: boMessage }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: fooMess }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: titMess,
                    hasMediaAttachment: true,
                    ...(await prepareWAMessageMedia(
                        { image: { url: image } },
                        { upload: m.client.waUploadToServer }
                    ))
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: buttonType,
                        buttonParamsJson: JSON.stringify({
                            display_text: textCommand,
                            url,
                            merchant_url: url
                        })
                    }]
                })
            }))
        )

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `*Explorez ...*\n★★★`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: ''
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: `*${text} Fonds d'écran*`,
                subtitle: 'Glissez pour profiter!',
                hasMediaAttachment: false
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
        });

        const msg = generateWAMessageFromContent(
            jid,
            { viewOnceMessage: { message: { interactiveMessage } } },
            { quoted: m }
        );

        await m.client.relayMessage(jid, msg.message, { messageId: msg.key.id });
    } catch (error) {
        console.error('Erreur lors de la récupération des fonds d\'écran nature:', error)
        return await m.send(`[ERREUR!] ${error}`)
    }
})

// =============================================
// COMMANDES D'IMAGE SUPPLÉMENTAIRES POUR KING 👑
// =============================================

King({
        cmd: "blur",
        desc: "appliquer un flou à l'image",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/blur?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "pixelate",
        desc: "pixelliser l'image",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/pixelate?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "sepia",
        desc: "appliquer un effet sépia à l'image",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/sepia?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

King({
        cmd: "grayscale",
        desc: "convertir l'image en niveaux de gris",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Répondez à un utilisateur ou à une photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/grayscale?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("✅")
        } catch (err) {
            console.error(err)
            return await m.send(`Erreur: ${err}`)
        }
})

console.log(`
╔═══════════════════════════════╗
║        KING IMAGE SYSTEM      ║
║         🎨 ACTIVATED 🎨       ║
║                               ║
║  🖼️  GFX Commands     🎭 Memes  ║
║  🔧 Image Processing  🖌️ Filters ║
║  💎 Upscale Quality   🎴 Wallpapers ║
║                               ║
║     👑 KING MODE: ON 👑      ║
╚═══════════════════════════════╝
`);
