// One catalogue of image URLs, shared by every test that checks what an image field
// may hold (libs, article cover, article gallery, CMS fields, CMS list items), so they
// all agree on what "any kind of image URL" means.

export type ImageUrlCase = [label: string, url: string]

export const ACCEPTED_IMAGE_URLS: ImageUrlCase[] = [
  // 1. this site's own public/ folder — older articles and built-in defaults
  ['public/ file', '/news1.jpg'],
  ['public/ jpeg', '/stories1.jpeg'],
  ['public/ file in a sub-folder', '/updated-logos/Indonesia/logo-blue-transparent.png'],
  ['public/ file with a cache-busting query', '/about.jpg?v=2'],
  ['public/ file with a percent-encoded space', '/my%20photo.jpg'],
  ['public/ file with a space and parentheses in its name', '/my photo (1).jpg'],

  // 3. our own R2 bucket (what the image picker uploads)
  ['R2 article upload', 'https://media.indonesiatanpapolusi.org/articles/user_1/3f2c9a1e-6b1d-4c1a-9a53-0a5c1f0d7e11.jpg'],
  ['R2 CMS upload', 'https://media.indonesiatanpapolusi.org/site/admin_1/3f2c9a1e-6b1d-4c1a-9a53-0a5c1f0d7e11.webp'],
  ['apex-domain upload', 'https://indonesiatanpapolusi.org/articles/user_1/a.jpg'],
  ['R2 dev (pub-*.r2.dev) URL', 'https://pub-0123456789abcdef0123456789abcdef.r2.dev/articles/u/a.jpg'],
  ['staging bucket on another domain', 'https://staging-media.example.org/articles/u/a.jpg'],
  ['our host, outside the uploads folders', 'https://media.indonesiatanpapolusi.org/other/a.jpg'],

  // 2. images hosted on other sites
  ['Cloudinary (transformations in the path)', 'https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_600/v1/sample.jpg'],
  [
    'Unsplash (long query string)',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  ],
  ['Google Drive direct link', 'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQrStUvWxYz'],
  ['Google Drive thumbnail', 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz&sz=w1000'],
  ['Google user content', 'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz=w1200'],
  ['Wikimedia (parentheses in the file name)', 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Smoke_(pollution).jpg'],
  ['Imgur', 'https://i.imgur.com/AbCdE12.jpg'],
  ['Dropbox (raw=1)', 'https://www.dropbox.com/s/abc123/pic.jpg?raw=1'],
  ['Pexels', 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1260'],
  ['image URL without a file extension', 'https://picsum.photos/id/237/800/600'],
  [
    'signed S3-style URL (percent-encoding, expiry)',
    'https://bucket.s3.ap-southeast-1.amazonaws.com/uploads/a%20b.jpg?X-Amz-Signature=abc%2Bdef&X-Amz-Expires=3600',
  ],
  ['host with a port', 'https://cdn.example.com:8443/pic.png'],
  ['bare IP address', 'https://203.0.113.5/pic.png'],
  ['internationalised domain (punycode)', 'https://xn--bcher-kva.example/pic.jpg'],
  ['URL with a fragment', 'https://example.org/pic.png#section'],
  ['uppercase scheme and host', 'HTTPS://EXAMPLE.ORG/PIC.JPG'],
  ['SVG', 'https://example.org/logo.svg'],
  ['GIF', 'https://media.giphy.com/media/abc123/giphy.gif'],
]

// Never storable as an image. (Surrounding whitespace is trimmed by the CMS routes
// before validation, so it is covered at the library level only.)
export const REJECTED_IMAGE_URLS: ImageUrlCase[] = [
  ['javascript: URL', 'javascript:alert(1)'],
  ['data: URI', 'data:image/png;base64,iVBORw0KGgo='],
  ['blob: URL', 'blob:https://example.org/3f2c9a1e'],
  ['file: URL', 'file:///etc/passwd'],
  ['ftp: URL', 'ftp://example.org/a.jpg'],
  ['plain http (blocked as mixed content on our https site)', 'http://example.org/a.jpg'],
  ['protocol-relative URL', '//evil.example/a.jpg'],
  ['backslash host (browsers read "/\\" like "//")', '/\\evil.example/a.jpg'],
  ['relative path without a leading slash', 'news1.jpg'],
  ['dot-relative path', './news1.jpg'],
  ['not a URL at all', 'not a url'],
  ['embedded control character', 'https://example.org/a\t.jpg'],
]
