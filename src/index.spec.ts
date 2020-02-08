const hexToBase64 = (hex: string) =>
  Buffer.from(hex
    .replace(/\-/gm, ''),
    'hex'
  )
    .toString('base64')
    .replace(/\//gm, '_')
    .replace(/\+/gm, '-')
    .replace(/\=/gm, '')
    ;
const base64ToHex = (base64: string) =>
  Buffer.from(base64
    .replace(/_/gm, '\/')
    .replace(/-/gm, '+'),
    'base64'
  )
    .toString('hex');

test('Hex to Base64', () => {
  expect(hexToBase64('a---b')).toBe('qw');
});
