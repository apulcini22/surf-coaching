# DNS Configuration for surfrightcoaching.com on GitHub Pages

## Required DNS Records

You need to configure the following DNS records with your domain registrar:

### For the apex domain (surfrightcoaching.com):

Set up **A records** pointing to GitHub Pages IP addresses:

```
@ 3600 IN A 185.199.108.153
@ 3600 IN A 185.199.109.153
@ 3600 IN A 185.199.110.153
@ 3600 IN A 185.199.111.153
```

### For the www subdomain (www.surfrightcoaching.com):

Set up a **CNAME record**:

```
www 3600 IN CNAME [your-github-username].github.io.
```

Replace `[your-github-username]` with your actual GitHub username.

> **Important**: Make sure the CNAME record includes the trailing dot after github.io.

## How to Verify Your DNS Configuration

After setting up your DNS records, you can verify they are correctly configured using the `dig` command in a terminal:

```bash
# Verify A records for apex domain
dig surfrightcoaching.com +nostats +nocomments +nocmd

# Verify CNAME record for www subdomain
dig www.surfrightcoaching.com +nostats +nocomments +nocmd
```

## GitHub Repository Configuration

1. Make sure there's a `CNAME` file in the root of your repository with just one line:

   ```
   www.surfrightcoaching.com
   ```

2. In your repository settings (Settings > Pages):
   - Under "Custom domain," enter `www.surfrightcoaching.com`
   - Click "Save"
   - Wait for DNS verification (can take up to 24 hours)
   - Once verification is complete, enable "Enforce HTTPS"

## Common Issues and Solutions

1. **DNS Propagation Delay**: Changes to DNS records can take up to 24-48 hours to fully propagate.

2. **Incorrect Format**: Ensure your CNAME record points to your `username.github.io` with a trailing dot.

3. **Conflicting Records**: Make sure you don't have conflicting records (like multiple CNAME records).

4. **Missing CNAME File**: Ensure the CNAME file exists in your repository and contains only your domain name.

## If Problems Persist

If after 24-48 hours your custom domain still shows an error:

1. Check with your domain registrar to confirm your DNS settings are correct
2. Verify there are no DNS conflicts or restrictions with your domain
3. Try removing and re-adding your custom domain in GitHub Pages settings
