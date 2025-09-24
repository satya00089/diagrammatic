import React from 'react';
export const useFocus = () => {
  const [focused, setFocused] = React.useState(false);
  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);
  return { focused, onFocus, onBlur };
};
