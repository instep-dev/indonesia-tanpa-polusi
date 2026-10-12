import { validateArticleLinks } from '@/libs/articleInput'

// Cover-image rules live in image-urls.test.ts (they share one catalogue of URL kinds).

describe('validateArticleLinks — external links', () => {
  it('accepts absent, null and empty values', () => {
    expect(validateArticleLinks({})).toBeNull()
    expect(validateArticleLinks({ reportUrl: '', pressReleaseUrl: null, visualUrl: undefined })).toBeNull()
  })

  it('accepts http(s) links', () => {
    expect(
      validateArticleLinks({
        reportUrl: 'https://example.org/report.pdf',
        pressReleaseUrl: 'http://example.org/press',
        visualUrl: 'https://drive.google.com/drive/folders/1AbCdEf?usp=sharing',
      }),
    ).toBeNull()
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>1</script>', 'ftp://example.org/x', 'not a url', '//evil.example/x'])(
    'rejects %s as a link',
    (value) => {
      expect(validateArticleLinks({ reportUrl: value })).not.toBeNull()
      expect(validateArticleLinks({ pressReleaseUrl: value })).not.toBeNull()
      expect(validateArticleLinks({ visualUrl: value })).not.toBeNull()
    },
  )

  it('rejects non-string link values', () => {
    expect(validateArticleLinks({ reportUrl: 123 })).not.toBeNull()
    expect(validateArticleLinks({ visualUrl: { href: 'https://example.org' } })).not.toBeNull()
  })

  it('does not re-check a link that is unchanged from what is stored', () => {
    const current = { coverImage: null, reportUrl: 'ftp://legacy.example/report', pressReleaseUrl: null, visualUrl: null }
    expect(validateArticleLinks({ reportUrl: current.reportUrl }, current)).toBeNull()
    expect(validateArticleLinks({ reportUrl: 'javascript:alert(1)' }, current)).not.toBeNull()
  })
})
