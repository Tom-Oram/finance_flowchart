import { ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-3">Attribution & License</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This app is based on the{' '}
              <a
                href="https://ukpersonal.finance/flowchart/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                UKPF Flowchart
                <ExternalLink className="h-3 w-3" />
              </a>
              , published under{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                CC BY-NC-SA 4.0
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              This app is non-commercial and share-alike compatible.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Important Disclaimer</h3>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>This is not financial advice.</strong> The information provided is for
              educational purposes only. Always do your own research and consider seeking
              professional advice for your specific circumstances.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Problem Debt Support</h3>
            <p className="text-sm text-muted-foreground mb-2">
              If you are struggling with debt, free help is available:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <a
                  href="https://www.stepchange.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  StepChange Debt Charity
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nationaldebtline.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  National Debtline
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.citizensadvice.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Citizens Advice
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            For more information, visit{' '}
            <a
              href="https://ukpersonal.finance/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ukpersonal.finance
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
