# Script para remover Navbar duplicado de páginas de cliente
# Este script elimina el import de Navbar y el wrapper div/main de cada página

$files = @(
    "c:\Users\GASTO\Desktop\proyectos\nextjs\app\dashboard\client\classes\page.tsx",
    "c:\Users\GASTO\Desktop\proyectos\nextjs\app\dashboard\client\payments\page.tsx",
    "c:\Users\GASTO\Desktop\proyectos\nextjs\app\dashboard\client\qr\page.tsx",
    "c:\Users\GASTO\Desktop\proyectos\nextjs\app\dashboard\client\history\page.tsx"
)

foreach ($file in $files) {
    Write-Host "Procesando: $file"
    
    $content = Get-Content $file -Raw
    
    # Remover import de Navbar
    $content = $content -replace "import Navbar from '@/components/Navbar';`r?`n", ""
    
    # Remover <div className="min-h-screen...">
    $content = $content -replace '<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">`r?`n', ""
    
    # Remover <Navbar activeTab="..." />
    $content = $content -replace '\s*<Navbar activeTab="[^"]*" />`r?`n', ""
    
    # Remover <main className="max-w-7xl...">
    $content = $content -replace '\s*<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`r?`n', ""
    
    # Cambiar </main></div> por </>  
    $content = $content -replace '</main>`r?`n\s*</div>`r?`n\s*\);', '</>`r`n    );'
    
    # Cambiar return ( <div> por return ( <>
    $content = $content -replace '(return \(`r?`n\s*)<div className="min-h-screen[^"]*">', '$1<>'
    
    # Guardar archivo
    Set-Content $file $content -NoNewline
    
    Write-Host "✓ Procesado: $file`n"
}

Write-Host "✅ Todos los archivos procesados correctamente"
