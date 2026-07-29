import { useEffect, useRef, useState } from 'react'
import { createSearchSession, retrievePlace, searchPlaces, type GeocodeSuggestion, type PlaceSuggestion } from './routingApi'

interface Props {
  onAdd: (suggestion: GeocodeSuggestion) => void
}

export default function LocationSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionTokenRef = useRef(createSearchSession())

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await searchPlaces(query, sessionTokenRef.current)
        setSuggestions(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Onbekende fout')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function handleSelect(s: PlaceSuggestion) {
    setResolving(true)
    setError(null)
    try {
      const resolved = await retrievePlace(s.id, sessionTokenRef.current)
      onAdd(resolved)
      setQuery('')
      setSuggestions([])
      sessionTokenRef.current = createSearchSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="location-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een adres, plaats of bedrijf..."
        aria-label="Zoek een locatie"
      />
      {(loading || resolving) && <div className="search-status">Zoeken...</div>}
      {error && <div className="search-status search-error">{error}</div>}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => handleSelect(s)}>
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
