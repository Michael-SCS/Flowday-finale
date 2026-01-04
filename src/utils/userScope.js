let _currentUserId = null;
const _listeners = new Set();

export function setCurrentUserId(userId) {
  const next = userId ? String(userId) : null;
  if (_currentUserId === next) return;
  _currentUserId = next;
  for (const listener of _listeners) {
    try {
      listener(_currentUserId);
    } catch {
      // ignore listener errors
    }
  }
}

export function getCurrentUserId() {
  return _currentUserId;
}

export function onCurrentUserIdChange(listener) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export function userScopedKey(baseKey, userId = _currentUserId) {
  const id = userId ? String(userId) : null;
  if (!id) return null;
  return `${baseKey}_${id}`;
}
