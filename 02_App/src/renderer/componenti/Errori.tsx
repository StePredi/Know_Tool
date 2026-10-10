import { Component, type ReactNode } from 'react'

/** Se un componente si rompe, l'app mostra un avviso invece di una pagina bianca. */
export class Errori extends Component<{ children: ReactNode }, { errore: Error | null }> {
  state = { errore: null as Error | null }
  static getDerivedStateFromError(errore: Error): { errore: Error } {
    return { errore }
  }
  render(): ReactNode {
    if (!this.state.errore) return this.props.children
    return (
      <div style={{ padding: 30, maxWidth: 640, margin: '40px auto' }}>
        <h1 style={{ fontSize: 20 }}>Qualcosa non ha funzionato</h1>
        <p className="note">{this.state.errore.message}</p>
        <p>I tuoi file non sono stati toccati. Riprova a ricaricare.</p>
        <button className="btn lg" onClick={() => this.setState({ errore: null })}>
          Riprova
        </button>
      </div>
    )
  }
}
