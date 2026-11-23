# Contributing · Cómo colaborar

Thanks for helping with Pirson's Addons! · ¡Gracias por ayudar con Pirson's Addons!

## 🐞 Bugs · Fallos

Open an issue with the **Bug report** form, or post in `#bug-reports` on [Discord](https://discord.gg/BM3hXNZXTh). Always include the addon version, your game (Retail, Classic or WoW Forever) and the Lua error if there is one.

Abre un issue con el formulario **Informar de un fallo**, o escribe en `#bug-reports` en [Discord](https://discord.gg/BM3hXNZXTh). Incluye siempre la versión del addon, tu juego (Retail, Classic o WoW Forever) y el error de Lua si lo hay.

## 💡 Ideas

Use the **Idea or improvement** form, or `#suggestions` on Discord. One idea per issue, and explain the problem it solves.

Usa el formulario **Idea o mejora**, o `#suggestions` en Discord. Una idea por issue, y explica qué problema resuelve.

## 🌍 Translations · Traducciones

Every addon keeps its texts in `Locales/<language>.lua` (`esES.lua`, `deDE.lua`, `frFR.lua`...), with `enUS.lua` as the reference.

1. Copy the lines from `enUS.lua` that are missing or wrong in your language file.
2. Translate only the text on the right of `=`, keep the key on the left and any `%s` / `%d` as they are.
3. Open a pull request, or send the file in `#translations` on Discord.

Cada addon guarda sus textos en `Locales/<idioma>.lua`, con `enUS.lua` como referencia. Traduce solo el texto a la derecha del `=`, deja la clave de la izquierda y los `%s` / `%d` como están, y abre un pull request o manda el archivo en `#translations` en Discord.

## 🔧 Code · Código

Pull requests are welcome for small fixes. For bigger changes, open an issue first so we agree on the approach. Releases are published by the maintainer: please do not change the `## Version` line of the `.toc` files.

Los pull requests para arreglos pequeños son bienvenidos. Para cambios grandes, abre antes un issue y lo hablamos. Las versiones las publica el mantenedor: no cambies la línea `## Version` de los `.toc`.
