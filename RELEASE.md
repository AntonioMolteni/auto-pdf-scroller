# Release Process Guide

This guide walks you through creating a new release of Auto PDF Scroller.

## Prerequisites (One-time Setup)

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"
4. Save

### 2. Verify Workflow File

Ensure `.github/workflows/deploy-gh-pages.yml` exists and is committed to your repository.

## Release Steps

### Step 1: Prepare Your Code

Make sure all changes are committed and pushed to the `main` branch:

```bash
git status  # Should show "nothing to commit, working tree clean"
git pull    # Get latest changes
```

### Step 2: Bump Version

Choose the appropriate version bump based on your changes:

- **Patch** (1.0.4 → 1.0.5): Bug fixes, minor improvements
- **Minor** (1.0.4 → 1.1.0): New features, backward compatible
- **Major** (1.0.4 → 2.0.0): Breaking changes

Run one of these commands:

```bash
# For bug fixes and small updates
npm run release:patch

# For new features
npm run release:minor

# For breaking changes
npm run release:major
```

This will:

- ✅ Update `package.json` version
- ✅ Create a git commit
- ✅ Create a git tag (e.g., `v1.0.5`)
- ✅ Push everything to GitHub

### Step 3: Create GitHub Release

1. Go to your repository on GitHub
2. Click **Releases** (right sidebar) → **Draft a new release**
3. Click **Choose a tag** → Select the tag that was just created (e.g., `v1.0.5`)
4. **Release title**: `v1.0.5` (or your version)
5. **Description**: Add release notes describing what changed

   ```markdown
   ## What's New

   - Added feature X
   - Fixed bug Y
   - Improved performance Z

   ## Downloads

   - **macOS**: Download the `.dmg` file
   - **Windows**: Download the `.exe` file
   - **Linux**: Download the `.AppImage`, `.deb`, or `.rpm` file
   - **Web Archive**: Download the `.zip` file to self-host
   ```

6. Click **Publish release**

### Step 4: Wait for Automation

Once you publish the release, GitHub Actions will automatically:

1. **Build Web Version** (~2-3 minutes)

   - Creates web build
   - Attaches `auto-pdf-scroller-web-v1.0.5.zip` to release

2. **Build Electron Apps** (~5-10 minutes)

   - Builds for macOS, Windows, and Linux in parallel
   - Attaches all platform files to release:
     - `Auto PDF Scroller-1.0.5-arm64.dmg` (macOS)
     - `Auto PDF Scroller Setup 1.0.5.exe` (Windows)
     - `auto-pdf-scroller-1.0.5.AppImage` (Linux)
     - Additional formats (.deb, .rpm, .zip, etc.)

3. **Deploy to GitHub Pages** (~1-2 minutes)
   - Updates https://antoniomolteni.github.io/auto-pdf-scroller/

### Step 5: Verify

1. **Check Workflow Status**

   - Go to **Actions** tab on GitHub
   - Verify "Release and Deploy" workflow completed successfully (green checkmark)

2. **Check Release Assets**

   - Go to your release page
   - Verify all files are attached (web zip, dmg, exe, AppImage, etc.)

3. **Test GitHub Pages**

   - Visit https://antoniomolteni.github.io/auto-pdf-scroller/
   - Verify the app works correctly

4. **Test Downloads** (Optional)
   - Download the appropriate file for your platform
   - Install and verify it works

## Troubleshooting

### Workflow Fails

1. Click on the failed workflow in the **Actions** tab
2. Click on the failed job to see error details
3. Fix the issue in your code
4. Delete the release and tag on GitHub
5. Delete the local tag: `git tag -d v1.0.5`
6. Start over from Step 2

### Missing Files in Release

- Check the workflow logs in **Actions** tab
- Ensure all build commands work locally:
  ```bash
  npm run build:web
  npm run build:electron
  ```

### GitHub Pages Not Updating

1. Go to **Settings** → **Pages**
2. Verify **Source** is set to "GitHub Actions"
3. Check the workflow logs for deploy-pages job
4. Wait a few minutes and try again (DNS propagation)

## Quick Reference

```bash
# Patch release (bug fixes)
npm run release:patch

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

Then create a GitHub Release from the new tag, and automation handles the rest!
