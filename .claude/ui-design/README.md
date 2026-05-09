# UI Design — Código generado por Figma

Esta carpeta es **gitignored**. Va para uso local del developer.

## Para qué sirve

Pegá acá el código que te genera Figma (Make, Locofy, Anima, plugin de Figma to React, etc.).
Claude lo usa **solo como referencia visual** para entender:

- Paleta de colores y tokens del tema
- Layout y espaciado
- Componentes y variantes
- Tipografía
- Estados (hover, focus, disabled)

## Lo que NO se hace

- **No se copia el código tal cual.** Casi siempre el código de Figma viene con
  styles inline, clases hardcoded, libs distintas a las del stack del proyecto, y
  componentes que no respetan nuestras convenciones.
- **No se commitea.** El `.gitignore` raíz tiene `.claude/ui-design/` excluido
  (excepto este README).

## Cómo usarlo

1. Generá el código en Figma o copiá la screenshot del frame.
2. Pegalo dentro de esta carpeta (estructura libre).
3. Mencioná a Claude algo tipo: "implementá la pantalla de Nueva Venta con
   el diseño de `.claude/ui-design/new-sale/`" o pasale la imagen.
4. Claude lee, infiere los tokens del tema, y reescribe usando React + TanStack +
   Tailwind respetando las convenciones del proyecto.
