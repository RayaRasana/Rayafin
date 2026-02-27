# How to Install Vazir Font for Persian PDF

## Quick Steps

### 1. Download Vazir Font

**Option A: Direct Download**
- Visit: https://github.com/rastikerdar/vazir-font/releases
- Download: `vazir-font-v30.1.0.zip` (or latest version)

**Option B: Use this direct link**
```
https://github.com/rastikerdar/vazir-font/releases/download/v30.1.0/vazir-font-v30.1.0.zip
```

### 2. Extract and Place Font

1. Extract the downloaded ZIP file
2. Find the file: **`Vazir-Regular-FD.ttf`** (or `Vazir-Regular.ttf`)
3. Copy it to: `frontend/public/fonts/`

**Expected location:**
```
RR-Accounting/
  frontend/
    public/
      fonts/
        Vazir-Regular-FD.ttf  ← Place here
```

### 3. Done!

That's it! The application will automatically:
- Load the font when you export a Persian PDF
- Use proper Persian characters
- Display text right-to-left
- Show connected Persian letters correctly

---

## Alternative: If You Have the Font File

If you already have `Vazir-Regular-FD.ttf` or another Persian font:

1. **Rename it** to `Vazir-Regular-FD.ttf` (if needed)
2. **Place it** in `frontend/public/fonts/`
3. **Test** by exporting a PDF

---

## Testing

After installing the font:

1. Start/refresh your frontend application
2. Go to the Invoices page
3. Click the **purple PDF button** (فارسی)
4. Check the downloaded PDF

**You should see:**
- ✅ Proper Persian characters (not garbled)
- ✅ Right-to-left text direction
- ✅ Connected Persian letters
- ✅ Persian numbers (۱۲۳۴۵۶۷۸۹۰)

---

## Troubleshooting

### Font not loading?

Check browser console (F12) for errors. You might see:
```
Vazir font not found. Using fallback font.
```

**Solution:** Verify file is at: `frontend/public/fonts/Vazir-Regular-FD.ttf`

### Still garbled text?

1. Clear browser cache (Ctrl+F5)
2. Check filename is exactly: `Vazir-Regular-FD.ttf`
3. Try using the full Persian PDF export instead of working version

### Do I need to rebuild?

No! The font loads dynamically. Just refresh the browser.

---

## File Specifications

- **Format:** TrueType Font (.ttf)
- **Size:** ~200-300 KB
- **Encoding:** Unicode
- **Languages:** Persian/Farsi, Arabic

---

## What if I can't download the font?

You can provide me the font file and I'll help integrate it. Options:

1. **Upload to project** - Place the .ttf file in the fonts folder
2. **Convert to base64** - I can help embed it directly in code
3. **Use different font** - Any Persian-compatible .ttf font works

---

## Need Help?

If you have the font file ready, just:
1. Place it in `frontend/public/fonts/`
2. Name it `Vazir-Regular-FD.ttf`
3. Test the PDF export

The code is already set up to use it automatically!
