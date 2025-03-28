# Surf Right Coaching Website

A responsive website for a surf coaching business, featuring a modern design with booking capabilities.

## Features

- Responsive design that works on mobile, tablet, and desktop
- Booking form for new students
- Information about services and pricing
- Clean, modern UI that highlights surf coaching

## Hosting on GitHub Pages

This website is configured to be hosted on GitHub Pages under the domain "http://www.surfrightcoaching.com/". To set it up:

1. **Create a GitHub repository**:

   - Create a new repository on GitHub
   - Push all the files in this project to your repository

2. **Set up GitHub Pages**:

   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select the branch containing your site (usually `main`)
   - Click "Save"

3. **Configure your custom domain**:

   - In the GitHub Pages settings, enter `www.surfrightcoaching.com` in the Custom domain field
   - Check "Enforce HTTPS" (after DNS propagation is complete)

4. **DNS Configuration**:
   - Log into your domain registrar's DNS settings
   - Add these records:
     - A record for `@` pointing to these GitHub Pages IP addresses:
       - 185.199.108.153
       - 185.199.109.153
       - 185.199.110.153
       - 185.199.111.153
     - CNAME record for `www` pointing to `<username>.github.io` (replace with your GitHub username)
   - Wait for DNS propagation (might take up to 24 hours)

## GitHub Actions

This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml` that automatically deploys your site to GitHub Pages whenever you push changes to the main branch.

## Structure

- `index.html` - Main HTML file
- `about.html` - Detailed About page with company story and instructor profiles
- `css/` - CSS stylesheets
- `js/` - JavaScript files
- `img/` - Images for the website
- `CNAME` - Custom domain configuration for GitHub Pages

## Customization

1. Update the hero image: Replace `img/surf-hero.jpg` with your own surf coaching image
2. Update instructor and group images: Replace `img/instructor.jpg` and `img/surf-group.jpg`
3. Change text content in `index.html` and `about.html` to match your business
4. Update contact information in the footer
5. Modify colors in `css/styles.css` to match your branding

## Development

To make changes:

1. Clone the repository
2. Edit the HTML, CSS, or JS files
3. Test locally by opening `index.html` in a web browser
4. Commit and push changes to GitHub - your site will automatically deploy

## License

Free to use for personal and commercial projects.
