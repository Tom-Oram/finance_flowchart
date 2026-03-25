import { ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-12">
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Attribution & License</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Based on the{' '}
              <a
                href="https://ukpersonal.finance/flowchart/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                UKPF Flowchart
                <ExternalLink className="h-3 w-3" />
              </a>
              , published under{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                CC BY-NC-SA 4.0
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Non-commercial and share-alike compatible.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Disclaimer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground/80">This is not financial advice.</strong> For educational purposes only. Always do your own research and consider professional advice for your circumstances.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Debt Support</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Free help is available if you are struggling:
            </p>
            <ul className="text-sm space-y-2">
              {[
                { href: 'https://www.stepchange.org/', label: 'StepChange Debt Charity' },
                { href: 'https://www.nationaldebtline.org/', label: 'National Debtline' },
                { href: 'https://www.citizensadvice.org.uk/', label: 'Citizens Advice' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>
            For more information, visit{' '}
            <a
              href="https://ukpersonal.finance/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              ukpersonal.finance
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
