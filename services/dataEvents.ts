type DataDomain = 'history' | 'craving' | 'plan' | 'preferences' | 'report';
type Listener = (domain: DataDomain) => void;

const listeners = new Set<Listener>();

export function emitDataChange(domain: DataDomain) {
  listeners.forEach((listener) => listener(domain));
}

export function subscribeToDataChanges(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
