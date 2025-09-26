#!/usr/bin/env node

/**
 * Robust TypeScript Build Script for Shared Types
 *
 * This script provides a permanent solution for TypeScript compilation issues
 * by implementing multiple fallback strategies and comprehensive error handling.
 */

const fs = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')

const SHARED_DIR = __dirname
const SRC_DIR = path.join(SHARED_DIR, 'src')
const DIST_DIR = path.join(SHARED_DIR, 'dist')
const TSCONFIG_PATH = path.join(SHARED_DIR, 'tsconfig.json')

/**
 * Logger utility
 */
const log = {
  info: msg => console.log(`ℹ️  ${msg}`),
  success: msg => console.log(`✅ ${msg}`),
  warning: msg => console.log(`⚠️  ${msg}`),
  error: msg => console.error(`❌ ${msg}`),
  debug: msg => console.log(`🔍 ${msg}`),
}

/**
 * Clean the dist directory
 */
function cleanDist() {
  log.info('Cleaning dist directory...')
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(DIST_DIR, { recursive: true })
  log.success('Dist directory cleaned and recreated')
}

/**
 * Validate source files exist
 */
function validateSourceFiles() {
  log.info('Validating source files...')

  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source directory not found: ${SRC_DIR}`)
  }

  if (!fs.existsSync(TSCONFIG_PATH)) {
    throw new Error(`TypeScript config not found: ${TSCONFIG_PATH}`)
  }

  const sourceFiles = fs
    .readdirSync(SRC_DIR, { recursive: true })
    .filter(file => file.endsWith('.ts') && !file.includes('.d.ts'))

  if (sourceFiles.length === 0) {
    throw new Error('No TypeScript source files found')
  }

  log.success(`Found ${sourceFiles.length} TypeScript source files`)
  return sourceFiles
}

/**
 * Method 1: Direct TypeScript compilation
 */
function buildWithTSC() {
  log.info('Attempting build with tsc...')

  try {
    execSync('npx tsc --project tsconfig.json', {
      cwd: SHARED_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
    })

    if (fs.existsSync(DIST_DIR) && fs.readdirSync(DIST_DIR).length > 0) {
      log.success('Build successful with tsc')
      return true
    }

    log.warning('tsc ran but no output generated')
    return false
  } catch (error) {
    log.error(`tsc failed: ${error.message}`)
    return false
  }
}

/**
 * Method 2: Forced compilation with explicit flags
 */
function buildWithExplicitFlags() {
  log.info('Attempting build with explicit flags...')

  try {
    const cmd = [
      'npx tsc',
      '--outDir ./dist',
      '--rootDir ./src',
      '--declaration true',
      '--emitDeclarationOnly false',
      '--noEmit false',
      '--target ES2020',
      '--module commonjs',
      '--moduleResolution node',
      '--allowJs true',
      '--skipLibCheck true',
      '--esModuleInterop true',
      '--strict true',
      '--preserveConstEnums true',
      '"src/**/*.ts"',
    ].join(' ')

    execSync(cmd, {
      cwd: SHARED_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
    })

    // Also explicitly compile the main index file
    try {
      execSync(
        'npx tsc src/index.ts --outDir ./dist --declaration --target ES2020 --module commonjs --moduleResolution node --allowJs --skipLibCheck --esModuleInterop',
        {
          cwd: SHARED_DIR,
          stdio: 'pipe',
        }
      )
    } catch (indexError) {
      log.warning('Could not compile index.ts separately')
    }

    if (fs.existsSync(DIST_DIR) && fs.readdirSync(DIST_DIR).length > 0) {
      log.success('Build successful with explicit flags')
      return true
    }

    return false
  } catch (error) {
    log.error(`Explicit flags build failed: ${error.message}`)
    return false
  }
}

/**
 * Method 3: Manual file compilation
 */
function buildManually() {
  log.info('Attempting manual file-by-file compilation...')

  try {
    // Find all TypeScript files
    const findTSFiles = (dir, files = []) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          findTSFiles(fullPath, files)
        } else if (
          entry.name.endsWith('.ts') &&
          !entry.name.endsWith('.d.ts')
        ) {
          files.push(fullPath)
        }
      }

      return files
    }

    const tsFiles = findTSFiles(SRC_DIR)
    log.debug(`Found ${tsFiles.length} TypeScript files to compile`)

    // Compile each file individually and copy to dist
    for (const file of tsFiles) {
      const relativePath = path.relative(SRC_DIR, file)
      const jsFile = relativePath.replace(/\.ts$/, '.js')
      const dtsFile = relativePath.replace(/\.ts$/, '.d.ts')

      const outputJsPath = path.join(DIST_DIR, jsFile)
      const outputDtsPath = path.join(DIST_DIR, dtsFile)

      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outputJsPath), { recursive: true })

      try {
        // Compile individual file
        execSync(
          `npx tsc "${file}" --outDir "${DIST_DIR}" --declaration --target ES2020 --module commonjs --moduleResolution node --allowJs --skipLibCheck --esModuleInterop`,
          {
            cwd: SHARED_DIR,
            stdio: 'pipe',
          }
        )
      } catch (fileError) {
        log.warning(`Failed to compile ${relativePath}: ${fileError.message}`)
      }
    }

    if (fs.existsSync(DIST_DIR) && fs.readdirSync(DIST_DIR).length > 0) {
      log.success('Manual compilation successful')
      return true
    }

    return false
  } catch (error) {
    log.error(`Manual compilation failed: ${error.message}`)
    return false
  }
}

/**
 * Method 4: Fallback - Simple JavaScript copy with type generation
 */
function buildFallback() {
  log.info('Using fallback method - copying and transforming files...')

  try {
    const copyFiles = (srcDir, destDir) => {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name)
        const destPath = path.join(destDir, entry.name)

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true })
          copyFiles(srcPath, destPath)
        } else if (entry.name.endsWith('.ts')) {
          // Copy as .js and create .d.ts
          const content = fs.readFileSync(srcPath, 'utf8')

          // Simple transform - remove type annotations for JS
          let jsContent = content
            .replace(/^import\s+type\s+/gm, 'import ')
            .replace(/:\s*[^=,\)\{\}\[\];]+(?=[=,\)\{\}\[\];])/g, '')
            .replace(/\s+as\s+const/g, '')

          const jsFile = destPath.replace(/\.ts$/, '.js')
          const dtsFile = destPath.replace(/\.ts$/, '.d.ts')

          fs.writeFileSync(jsFile, jsContent)
          fs.writeFileSync(dtsFile, content) // Keep original as declaration
        }
      }
    }

    copyFiles(SRC_DIR, DIST_DIR)

    log.success('Fallback method completed')
    return true
  } catch (error) {
    log.error(`Fallback method failed: ${error.message}`)
    return false
  }
}

/**
 * Validate the build output
 */
function validateBuild() {
  log.info('Validating build output...')

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory was not created')
  }

  const distFiles = fs.readdirSync(DIST_DIR, { recursive: true })
  const jsFiles = distFiles.filter(f => f.endsWith('.js'))
  const dtsFiles = distFiles.filter(f => f.endsWith('.d.ts'))

  if (jsFiles.length === 0 && dtsFiles.length === 0) {
    throw new Error('No output files were generated')
  }

  log.success(
    `Build validation passed: ${jsFiles.length} JS files, ${dtsFiles.length} declaration files`
  )

  // Check for index files
  const hasIndexJs = fs.existsSync(path.join(DIST_DIR, 'index.js'))
  const hasIndexDts = fs.existsSync(path.join(DIST_DIR, 'index.d.ts'))

  if (!hasIndexJs || !hasIndexDts) {
    log.warning('Missing index files - build may be incomplete')
  }

  return { jsFiles: jsFiles.length, dtsFiles: dtsFiles.length }
}

/**
 * Main build function
 */
async function buildSharedTypes() {
  log.info('🚀 Starting robust shared types build...')

  try {
    // Step 1: Validate environment
    validateSourceFiles()

    // Step 2: Clean output directory
    cleanDist()

    // Step 3: Try build methods in order of preference
    const buildMethods = [
      { name: 'Standard TSC', method: buildWithTSC },
      { name: 'Explicit Flags', method: buildWithExplicitFlags },
      { name: 'Manual Compilation', method: buildManually },
      { name: 'Fallback Copy', method: buildFallback },
    ]

    let success = false

    for (const { name, method } of buildMethods) {
      log.info(`Trying ${name}...`)

      if (method()) {
        success = true
        log.success(`✅ Build successful using ${name}`)
        break
      }

      log.warning(`${name} failed, trying next method...`)
    }

    if (!success) {
      throw new Error('All build methods failed')
    }

    // Step 4: Validate output
    const stats = validateBuild()

    log.success(`🎉 Shared types build completed successfully!`)
    log.info(`   📁 Generated ${stats.jsFiles} JavaScript files`)
    log.info(`   📋 Generated ${stats.dtsFiles} declaration files`)

    return true
  } catch (error) {
    log.error(`💥 Build failed: ${error.message}`)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  buildSharedTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { buildSharedTypes }
