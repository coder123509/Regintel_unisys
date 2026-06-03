import React from 'react';
import useTranslate from '../hooks/useTranslate';

/**
 * Component for hybrid translation.
 * Usage: 
 * For static text: <Translate isStatic>nav.home</Translate>
 * For dynamic content: <Translate dynamic visible={isActive}>{doc.summary}</Translate>
 */
const Translate = ({ children, isStatic = false, dynamic = false, visible = true }) => {
  const text = typeof children === 'string' ? children : '';
  const translated = useTranslate(text, { isStatic, dynamic, visible });
  
  return <>{translated}</>;
};

export default Translate;
