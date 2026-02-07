import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const REGEX_REFERENCE = [
  {
    token: '[a-m]',
    description: 'a through m',
    name: 'Character range',
    detail: 'Character class that matches any lowercase letter from a to m',
    examples: '`cat` -> matches `c`\n`zebra` -> no match',
  },
  {
    token: '[N-Z]',
    description: 'N through Z',
    name: 'Character range',
    detail: 'Character class that matches uppercase letters from N to Z',
    examples: '`NOV` -> matches `N`\n`apple` -> no match',
  },
  {
    token: '[0-6]',
    description: '0 through 6',
    name: 'Digit range',
    detail: 'Character class that matches digits 0 through 6',
    examples: '`5` -> match\n`9` -> no match',
  },
  {
    token: '[xyz]',
    description: 'x, y, or z',
    name: 'Character set',
    detail: 'Character class that matches x, y, or z exactly',
    examples: '`xray` -> matches `x`\n`alpha` -> no match',
  },
  {
    token: '[^a]',
    description: 'Not a',
    name: 'Negated set',
    detail: 'Negated character class that matches any character except a',
    examples: '`b` -> match\n`a` -> no match',
  },
  {
    token: '[^xy]',
    description: 'Not x or y',
    name: 'Negated set',
    detail: 'Negated character class that matches any character except x or y',
    examples: '`z` -> match\n`x` -> no match',
  },
  {
    token: '(ab|xy)',
    description: 'ab or xy',
    name: 'Alternation',
    detail: 'Matches either the literal string ab or xy',
    examples: '`ab` -> match\n`xy` -> match\n`az` -> no match',
  },
  {
    token: '.',
    description: 'Any character',
    name: 'Wildcard',
    detail: 'Wildcard that matches any character except new line',
    examples: '`a` -> match\n`\\n` -> no match',
  },
  {
    token: '\\w',
    description: 'Word char',
    name: 'Word character',
    detail: 'Matches letters, numbers, and underscore',
    examples: '`A` -> match\n`_` -> match\n`-` -> no match',
  },
  {
    token: '\\d',
    description: 'Digit',
    name: 'Digit',
    detail: 'Matches digits 0 through 9',
    examples: '`7` -> match\n`b` -> no match',
  },
  {
    token: '\\s',
    description: 'Whitespace',
    name: 'Whitespace',
    detail: 'Matches whitespace characters such as space or tab',
    examples: '`space` -> match\n`\\t` -> match\n`a` -> no match',
  },
  {
    token: '\\b',
    description: 'Word edge',
    name: 'Word boundary',
    detail: 'Zero-width boundary between word and non-word characters',
    examples: '`\\bword` -> before `w`\n`s\\b` -> after `s`',
  },
  {
    token: '\\x52',
    description: 'Hex 0x52 (R)',
    name: 'Hex escape',
    detail: 'Hex escape for character code 0x52, which is "R"',
    examples: '`R` -> match\n`r` -> no match',
  },
  {
    token: '\\130',
    description: 'Octal 130 (X)',
    name: 'Octal escape',
    detail: 'Octal escape for character code 130 (octal), which is "X"',
    examples: '`X` -> match\n`x` -> no match',
  },
  {
    token: '^ / $',
    description: 'Start / end',
    name: 'Anchors',
    detail: 'Anchors the match to the start (^) or end ($) of the input',
    examples: '`^hi` matches `hi`\n`end$` matches `end`',
  },
  {
    token: '* / +',
    description: '0+ / 1+ repeats',
    name: 'Quantifiers',
    detail: 'Repeat previous token zero or more (*) or one or more (+) times',
    examples: '`ab*` matches `a`\n`ab+` matches `ab`',
  },
  {
    token: '?',
    description: '0 or 1',
    name: 'Optional',
    detail: 'Previous token is optional (zero or one time)',
    examples: '`colou?r` matches `color` or `colour`',
  },
  {
    token: '{4}',
    description: 'Exactly 4',
    name: 'Quantifier',
    detail: 'Repeat previous token exactly 4 times',
    examples: '`\\d{4}` matches `2024`',
  },
  {
    token: '{4,}',
    description: '4 or more',
    name: 'Quantifier',
    detail: 'Repeat previous token 4 or more times',
    examples: '`a{4,}` matches `aaaa` or `aaaaa`',
  },
  {
    token: '{4,7}',
    description: '4 to 7',
    name: 'Quantifier',
    detail: 'Repeat previous token between 4 and 7 times',
    examples: '`a{4,7}` matches `aaaa` through `aaaaaaa`',
  },
  {
    token: '(?:...)',
    description: 'Non-capture',
    name: 'Non-capturing group',
    detail: 'Groups tokens without saving a capture group',
    examples: '`(?:ab)+` matches `abab`\nNo capture saved',
  },
  {
    token: '(...)',
    description: 'Capture',
    name: 'Capture group',
    detail: 'Capturing group: stores the matched substring',
    examples: '`(ab)+` captures `ab` in `abab`',
  },
];

const TOKEN_DESCRIPTIONS = {
  '.': 'Matches any character except new line.',
  '\\w': 'Matches any word character (letters, numbers, underscore).',
  '\\W': 'Matches any non-word character.',
  '\\d': 'Matches any digit (0-9).',
  '\\D': 'Matches any non-digit.',
  '\\s': 'Matches whitespace (space, tab, newline).',
  '\\S': 'Matches any non-whitespace.',
  '\\b': 'Word boundary anchor.',
  '^': 'Start of input.',
  '$': 'End of input.',
  '*': 'Previous token 0 or more times.',
  '+': 'Previous token 1 or more times.',
  '?': 'Previous token 0 or 1 times.',
};

const FLAG_DESCRIPTIONS = {
  g: 'Global: find all matches, not just the first.',
  i: 'Insensitive: ignore case.',
  m: 'Multiline: ^ and $ match line breaks.',
  s: 'DotAll: . also matches line breaks.',
  u: 'Unicode: treat pattern as Unicode.',
  y: 'Sticky: match starting at lastIndex only.',
  d: 'Indices: provide start/end indices for matches.',
  v: 'Set notation: enable Unicode set syntax.',
};

const DEMO_PATTERN = '(\\/) (o,,o) (\\/)';
const DEMO_FLAGS = 'g';
const DEMO_INPUT = 'Need a regular expression? Why not Zoidberg?\n/ o,,o /\n';

const parseExampleParts = (example) => {
  const parts = [];
  const pattern = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(example))) {
    if (match.index > lastIndex) {
      parts.push({ text: example.slice(lastIndex, match.index), code: false });
    }
    parts.push({ text: match[1], code: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < example.length) {
    parts.push({ text: example.slice(lastIndex), code: false });
  }

  return parts;
};

const renderInlineText = (text, keyPrefix) => (
  parseExampleParts(text).map((part, index) => (
    part.code ? (
      <span key={`${keyPrefix}-code-${index}`} className='tooltip-inline-code'>{part.text}</span>
    ) : (
      <span key={`${keyPrefix}-text-${index}`}>{part.text}</span>
    )
  ))
);

const renderExampleLine = (line, lineIndex) => (
  <div key={`example-line-${lineIndex}`} className='tooltip-example-line'>
    {parseExampleParts(line).map((part, index) => (
      part.code ? (
        <span key={`example-code-${lineIndex}-${index}`} className='tooltip-example-code'>{part.text}</span>
      ) : (
        <span key={`example-text-${lineIndex}-${index}`} className='tooltip-example-text'>{part.text}</span>
      )
    ))}
  </div>
);

const Tooltip = ({ title, detail, token, example, snippet, snippetLabel, variant }) => (
  <span className={variant === 'simple' ? 'tooltip tooltip-simple' : 'tooltip'}>
    {variant === 'simple' ? (
      <span className='tooltip-detail'>{renderInlineText(detail, 'simple-detail')}</span>
    ) : (
      <>
        <div className='tooltip-header'>
          <strong>{title}</strong>
          {token ? <span className='tooltip-token'>{token}</span> : null}
        </div>
        <span className='tooltip-detail'>{detail}</span>
        {snippet ? (
          <div className='tooltip-snippet'>
            <span className='tooltip-snippet-label'>{snippetLabel}</span>
            <span className='tooltip-example-code'>{snippet}</span>
          </div>
        ) : null}
        {example ? (
          <div className='tooltip-example'>
            <span className='tooltip-example-title'>Example</span>
            <div className='tooltip-example-lines'>
              {example.split('\n').map(renderExampleLine)}
            </div>
          </div>
        ) : null}
      </>
    )}
  </span>
);

const TooltipAnchor = ({ children, title, detail, token, example, snippet, snippetLabel, variant }) => {
  const anchorRef = useRef(null);
  const [touchActive, setTouchActive] = useState(false);

  const adjustTooltip = () => {
    if (!anchorRef.current) {
      return;
    }

    const tooltip = anchorRef.current.querySelector('.tooltip');
    if (!tooltip) {
      return;
    }

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const padding = 16;

    tooltip.dataset.placement = 'bottom';
    tooltip.style.left = '0';
    tooltip.style.right = 'auto';
    tooltip.style.top = `${anchorRect.bottom + 10}px`;
    tooltip.style.bottom = 'auto';
    tooltip.style.transform = 'translateY(-4px)';

    const tooltipRect = tooltip.getBoundingClientRect();
    let nextLeft = anchorRect.left;

    const spaceBelow = window.innerHeight - padding - anchorRect.bottom;
    const spaceAbove = anchorRect.top - padding;
    const spaceRight = window.innerWidth - padding - anchorRect.right;
    const spaceLeft = anchorRect.left - padding;

    const placements = [
      { name: 'bottom', space: spaceBelow },
      { name: 'top', space: spaceAbove },
      { name: 'right', space: spaceRight },
      { name: 'left', space: spaceLeft },
    ];

    const fits = {
      bottom: spaceBelow >= tooltipRect.height,
      top: spaceAbove >= tooltipRect.height,
      right: spaceRight >= tooltipRect.width,
      left: spaceLeft >= tooltipRect.width,
    };

    const preferred = ['bottom', 'top', 'right', 'left'];
    const defaultPlacement = preferred.find((placement) => fits[placement]);
    const bestPlacement = defaultPlacement || placements.sort((a, b) => b.space - a.space)[0].name;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const setPlacement = (placement) => {
      tooltip.dataset.placement = placement;
      if (placement === 'top') {
        tooltip.style.top = `${anchorRect.top - tooltipRect.height - 10}px`;
      } else if (placement === 'bottom') {
        tooltip.style.top = `${anchorRect.bottom + 2}px`;
      } else {
        const centeredTop = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
        tooltip.style.top = `${clamp(centeredTop, padding, window.innerHeight - padding - tooltipRect.height)}px`;
      }

      if (placement === 'left') {
        tooltip.style.left = `${anchorRect.left - tooltipRect.width - 6}px`;
      } else if (placement === 'right') {
        tooltip.style.left = `${anchorRect.right + 6}px`;
      } else {
        const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
        tooltip.style.left = `${clamp(centeredLeft, padding, window.innerWidth - padding - tooltipRect.width)}px`;
      }
    };

    setPlacement(bestPlacement);

    const nextRect = tooltip.getBoundingClientRect();
  };

  const dismissTouch = () => setTouchActive(false);

  const handleTouchStart = () => {
    setTouchActive(true);
    requestAnimationFrame(adjustTooltip);
  };

  useEffect(() => {
    if (!touchActive) {
      return;
    }

    const handleTouchOutside = (event) => {
      if (anchorRef.current && !anchorRef.current.contains(event.target)) {
        dismissTouch();
      }
    };

    window.addEventListener('scroll', dismissTouch, true);
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      window.removeEventListener('scroll', dismissTouch, true);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [touchActive]);

  return (
    <span
      className={`tooltip-anchor${touchActive ? ' tooltip-touch-active' : ''}`}
      ref={anchorRef}
      onMouseEnter={adjustTooltip}
      onFocus={adjustTooltip}
      onTouchStart={handleTouchStart}
    >
      {children}
      <Tooltip
        title={title}
        detail={detail}
        token={token}
        example={example}
        snippet={snippet}
        snippetLabel={snippetLabel}
        variant={variant}
      />
    </span>
  );
};

const ConfirmButton = ({ label, onConfirm, className, timeout = 3000 }) => {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  const handleClick = () => {
    if (confirming) {
      clearTimeout(timerRef.current);
      setConfirming(false);
      onConfirm();
      return;
    }

    setConfirming(true);
    timerRef.current = setTimeout(() => setConfirming(false), timeout);
  };

  const handleBlur = () => {
    clearTimeout(timerRef.current);
    setConfirming(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button className={`${className}${confirming ? ' button-confirm' : ''}`} type='button' onClick={handleClick} onBlur={handleBlur}>
      {confirming ? 'Confirm?' : label}
    </button>
  );
};

const parsePatternTokens = (pattern) => {
  if (!pattern) {
    return [];
  }

  const tokens = [];
  let buffer = '';
  let inCharClass = false;

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const next = pattern[i + 1];

    if (char === '\\') {
      buffer += char;
      if (next) {
        buffer += next;
        i += 1;
        tokens.push(buffer);
        buffer = '';
      }
      continue;
    }

    if (char === '[') {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      inCharClass = true;
      buffer += char;
      continue;
    }

    if (char === ']' && inCharClass) {
      buffer += char;
      tokens.push(buffer);
      buffer = '';
      inCharClass = false;
      continue;
    }

    if (inCharClass) {
      buffer += char;
      continue;
    }

    if (char === '{') {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      let quantifier = char;
      let j = i + 1;
      while (j < pattern.length) {
        quantifier += pattern[j];
        if (pattern[j] === '}') {
          break;
        }
        j += 1;
      }
      tokens.push(quantifier);
      i = j;
      continue;
    }

    if (['*', '+', '?'].includes(char)) {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      tokens.push(char);
      continue;
    }

    if (['(', ')', '|'].includes(char)) {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      tokens.push(char);
      continue;
    }

    buffer += char;
  }

  if (buffer) {
    tokens.push(buffer);
  }

  return tokens;
};

const describeToken = (token) => {
  if (TOKEN_DESCRIPTIONS[token]) {
    return TOKEN_DESCRIPTIONS[token].replace(/\.$/, '');
  }

  if (token.startsWith('[') && token.endsWith(']')) {
    if (token.startsWith('[^')) {
      return 'Negated character set';
    }
    return 'Character set';
  }

  if (token.startsWith('{') && token.endsWith('}')) {
    return 'Exact repetition';
  }

  if (token === '(') {
    return 'Start of capture group';
  }

  if (token === ')') {
    return 'End of capture group';
  }

  if (token === '|') {
    return 'Alternation';
  }

  if (token.startsWith('\\')) {
    return 'Escape sequence';
  }

  return 'Literal match';
};

const useMatches = (pattern, flags, input) => {
  return useMemo(() => {
    let regex = null;
    let error = '';

    try {
      regex = new RegExp(pattern, flags);
    } catch (err) {
      error = err.message;
    }

    if (!regex) {
      return { error, matches: [], groups: [], lines: input.split('\n') };
    }

    const lines = input.split('\n');
    const matches = [];
    const groups = [];

    lines.forEach((line) => {
      const lineMatches = [];
      const lineGroups = [];

      regex.lastIndex = 0;

      if (!regex.global) {
        const match = regex.exec(line);
        if (match) {
          lineMatches.push({
            from: match.index,
            to: match.index + match[0].length,
            value: match[0],
          });

          if (match.length > 1) {
            const captured = match.slice(1).filter((segment) => segment !== undefined && segment !== '');
            if (captured.length > 0) {
              lineGroups.push(captured);
            }
          }
        }
      } else {
        let match;
        while ((match = regex.exec(line))) {
          lineMatches.push({
            from: match.index,
            to: match.index + match[0].length,
            value: match[0],
          });

          if (match.length > 1) {
            const captured = match.slice(1).filter((segment) => segment !== undefined && segment !== '');
            if (captured.length > 0) {
              lineGroups.push(captured);
            }
          }

          if (match[0].length === 0) {
            break;
          }
        }
      }

      matches.push(lineMatches);
      lineGroups.forEach((group) => groups.push(group));
    });

    return { error, matches, groups, lines };
  }, [pattern, flags, input]);
};

const RegexBreakdown = ({ pattern }) => {
  const tokens = useMemo(() => parsePatternTokens(pattern), [pattern]);

  if (tokens.length === 0) {
    return <p className='muted'>Start typing to see a breakdown of your regex</p>;
  }

  return (
    <div className='regex-breakdown'>
      {tokens.map((token, index) => (
        <TooltipAnchor
          key={`${token}-${index}`}
          detail={describeToken(token)}
          variant='simple'
        >
          <span className='regex-token'>{token}</span>
        </TooltipAnchor>
      ))}
    </div>
  );
};

const buildLinePieces = (line, lineMatches) => {
  const pieces = [];
  let cursor = 0;

  lineMatches.forEach((match, matchIndex) => {
    if (cursor < match.from) {
      pieces.push({ text: line.slice(cursor, match.from), match: null });
    }
    pieces.push({ text: line.slice(match.from, match.to), match, matchIndex });
    cursor = match.to;
  });

  if (cursor < line.length) {
    pieces.push({ text: line.slice(cursor), match: null });
  }

  if (pieces.length === 0) {
    pieces.push({ text: line, match: null });
  }

  return pieces;
};

const MatchesOutput = ({ lines, matches, wrap }) => {
  if (lines.length === 1 && lines[0] === '' && matches.length === 0) {
    return <div className='match-output'>Add input to see matches.</div>;
  }

  const rendered = lines.map((line, lineIndex) => {
    const lineMatches = matches[lineIndex] || [];
    const pieces = buildLinePieces(line, lineMatches);
    const priorMatches = matches.slice(0, lineIndex).reduce((sum, matchLine) => sum + matchLine.length, 0);

    return (
      <div key={`line-${lineIndex}`}>
        {pieces.map((piece, index) => {
          if (!piece.match) {
            return <span key={`text-${index}`}>{piece.text}</span>;
          }

          return (
            <span key={`match-${index}`} className='match'>{piece.text}</span>
          );
        })}
      </div>
    );
  });

  return (
    <div className={`match-output${wrap ? ' match-output-wrap' : ' match-output-scroll'}`}>
      {rendered}
    </div>
  );
};

const encodeState = (state) => {
  const { pattern, flags, input } = state;
  const payload = {
    p: encodeURIComponent(pattern),
    f: encodeURIComponent(flags),
    s: encodeURIComponent(input),
  };

  if (!payload.p && !payload.f && !payload.s) {
    return '';
  }

  return btoa(JSON.stringify(payload));
};

const decodeState = () => {
  const hash = window.location.hash;
  const match = hash.match(/perm=([^&]+)/) || hash.match(/#perm\/([^&]+)/);

  if (!match) {
    return null;
  }

  try {
    const json = atob(match[1]);
    const payload = JSON.parse(json);
    return {
      pattern: decodeURIComponent(payload.p || ''),
      flags: decodeURIComponent(payload.f || ''),
      input: decodeURIComponent(payload.s || ''),
    };
  } catch (err) {
    return null;
  }
};

const GroupsPanel = ({ groups }) => {
  if (groups.length === 0) {
    return <p className='muted'>No capture groups</p>;
  }

  return (
    <div className='groups'>
      {groups.map((group, index) => (
        <div key={`group-${index}`} className='group-card'>
          <h4>{`Match ${index + 1} capture groups`}</h4>
          <ul>
            {group.map((item, itemIndex) => (
              <li key={`group-item-${itemIndex}`}>
                <span className='group-index'>{`${itemIndex + 1}: `}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const ReferencePanel = () => (
  <div className='reference-grid'>
    {REGEX_REFERENCE.map((item) => (
      <TooltipAnchor
        key={item.token}
        title={item.name}
        token={item.token}
        detail={item.detail}
        example={item.examples}
      >
        <div className='reference-card'>
          <strong>{item.token}</strong>
          <span>{item.description}</span>
        </div>
      </TooltipAnchor>
    ))}
  </div>
);

const flagSupportCache = {};
const isFlagSupported = (flag) => {
  if (flagSupportCache[flag] !== undefined) {
    return flagSupportCache[flag];
  }

  try {
    new RegExp('', flag);
    flagSupportCache[flag] = true;
  } catch (error) {
    flagSupportCache[flag] = false;
  }

  return flagSupportCache[flag];
};

const FlagsPanel = ({ flags }) => (
  <div className='groups flags-group'>
    {flags.length === 0 ? (
      <p className='muted'>Add flags to change matching behavior</p>
    ) : (
      flags.split('').map((flag, index) => {
        const description = FLAG_DESCRIPTIONS[flag];
        if (!description) {
          return (
            <TooltipAnchor
              key={`${flag}-${index}`}
              title={`/${flag}`}
              detail='Invalid flag'
              variant='simple'
            >
              <span className='regex-token regex-token-invalid'>{flag}</span>
            </TooltipAnchor>
          );
        }

        if (!isFlagSupported(flag)) {
          return (
            <TooltipAnchor
              key={`${flag}-${index}`}
              title={`/${flag}`}
              detail='Unsupported by browser'
              variant='simple'
            >
              <span className='regex-token regex-token-invalid'>{flag}</span>
            </TooltipAnchor>
          );
        }

        return (
          <TooltipAnchor
            key={`${flag}-${index}`}
            title={`/${flag}`}
            detail={description.replace(/\.$/, '')}
            variant='simple'
          >
            <span className='regex-token'>{flag}</span>
          </TooltipAnchor>
        );
      })
    )}
  </div>
);

const FlagsInfoTooltip = () => (
  <TooltipAnchor
    title='Flags'
    detail='Flags modify regex behavior.'
    example={[
      '`g` global search',
      '`i` case-insensitive',
      '`m` multiline',
      '`s` dot matches newline',
      '`u` unicode',
      '`y` sticky',
      '`d` indices',
      '`v` set notation',
    ].join('\n')}
  >
    <span className='help-icon'>?</span>
  </TooltipAnchor>
);

const App = () => {
  const initialState = decodeState() || {
    pattern: '',
    flags: '',
    input: '',
  };

  const [pattern, setPattern] = useState(initialState.pattern);
  const [flags, setFlags] = useState(initialState.flags);
  const [input, setInput] = useState(initialState.input);
  const [shareMessage, setShareMessage] = useState('');
  const [shareLabel, setShareLabel] = useState('Share');
  const [wrapMatches, setWrapMatches] = useState(true);
  const patternRef = useRef(null);
  const flagsRef = useRef(null);
  const inputRef = useRef(null);

  const { error, matches, groups, lines } = useMatches(pattern, flags, input);

  useEffect(() => {
    const handleHashChange = () => {
      const nextState = decodeState();

      if (!nextState) {
        if (window.location.hash) {
          if (pattern !== DEMO_PATTERN || flags !== DEMO_FLAGS || input !== DEMO_INPUT) {
            setPattern(DEMO_PATTERN);
            setFlags(DEMO_FLAGS);
            setInput(DEMO_INPUT);
          }
          return;
        }

        if (pattern || flags || input) {
          setPattern('');
          setFlags('');
          setInput('');
        }
        return;
      }

      if (nextState.pattern !== pattern) {
        setPattern(nextState.pattern);
      }
      if (nextState.flags !== flags) {
        setFlags(nextState.flags);
      }
      if (nextState.input !== input) {
        setInput(nextState.input);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pattern, flags, input]);

  useEffect(() => {
    if (patternRef.current && !decodeState()) {
      patternRef.current.focus();
    }
  }, []);

  const resizeInput = () => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${inputRef.current.scrollHeight + 4}px`;
  };

  useEffect(() => {
    resizeInput();
  }, [input]);

  useEffect(() => {
    const encoded = encodeState({ pattern, flags, input });
    const nextHash = encoded ? `#perm/${encoded}` : '';

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [pattern, flags, input]);

  const handleShare = async () => {
    const encoded = encodeState({ pattern, flags, input });
    const shareUrl = `${window.location.origin}${window.location.pathname}${encoded ? `#perm/${encoded}` : ''}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      setShareLabel('Copied');
      setTimeout(() => setShareLabel('Share'), 2000);
      return;
    }

    setShareLabel('Share');
    setShareMessage('Copy the URL from your browser address bar.');
    setTimeout(() => setShareMessage(''), 2000);
  };

  const applyInputValue = (element, nextValue) => {
    if (!element) {
      return false;
    }

    element.focus();
    if (typeof element.setSelectionRange === 'function') {
      element.setSelectionRange(0, element.value.length);
    }

    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, nextValue);
    } else if (typeof element.setRangeText === 'function') {
      element.setRangeText(nextValue, 0, element.value.length, 'end');
    } else {
      element.value = nextValue;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };

  const handleDemo = () => {
    const previousActive = document.activeElement;
    const patternApplied = applyInputValue(patternRef.current, DEMO_PATTERN);
    const flagsApplied = applyInputValue(flagsRef.current, DEMO_FLAGS);
    const inputApplied = applyInputValue(inputRef.current, DEMO_INPUT);

    if (previousActive && typeof previousActive.focus === 'function') {
      previousActive.focus();
    }

    if (!patternApplied) {
      setPattern(DEMO_PATTERN);
    }
    if (!flagsApplied) {
      setFlags(DEMO_FLAGS);
    }
    if (!inputApplied) {
      setInput(DEMO_INPUT);
    }
  };

  const handleClear = () => {
    const previousActive = document.activeElement;
    const patternApplied = applyInputValue(patternRef.current, '');
    const flagsApplied = applyInputValue(flagsRef.current, '');
    const inputApplied = applyInputValue(inputRef.current, '');

    if (previousActive && typeof previousActive.focus === 'function') {
      previousActive.focus();
    }

    if (!patternApplied) {
      setPattern('');
    }
    if (!flagsApplied) {
      setFlags('');
    }
    if (!inputApplied) {
      setInput('');
    }
  };

  return (
    <div className='app-inner'>
      <header className='header'>
        <div className='brand'>
          <h1>Regularish</h1>
          <p>a JavaScript regex editor</p>
        </div>
        <div className='header-actions'>
          {shareMessage ? <span className='muted'>{shareMessage}</span> : null}
          <button className='button' type='button' onClick={handleShare}>{shareLabel}</button>
          <a className='button button-github' href='https://github.com/gavinhungry/regularish' target='_blank' rel='noopener noreferrer'>GitHub</a>
        </div>
      </header>

      <div className='layout'>
        <section className='panel panel-wide reference'>
          <h2>Quick reference</h2>
          <ReferencePanel />
        </section>

        <section className='panel panel-scroll build'>
          <div className='panel-header'>
            <h2>Build your regex</h2>
            <div className='panel-actions'>
              <ConfirmButton className='button' label='Demo' onConfirm={handleDemo} />
              <ConfirmButton className='button button-warning' label='Clear' onConfirm={handleClear} />
            </div>
          </div>
          <div className='panel-body'>
            <div className='field inline-fields'>
              <div>
                <label htmlFor='pattern'>Pattern</label>
                <input
                  id='pattern'
                  type='text'
                  ref={patternRef}
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  spellCheck='false'
                />
              </div>
              <div className='field-separator'>/</div>
              <div>
                <label htmlFor='flags'>Flags</label>
                <FlagsInfoTooltip />
                <input
                  id='flags'
                  type='text'
                  ref={flagsRef}
                  value={flags}
                  onChange={(event) => setFlags(event.target.value)}
                  spellCheck='false'
                />
              </div>
            </div>

            <div className='field'>
              <label htmlFor='input'>Input</label>
              <textarea
                id='input'
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                spellCheck='false'
              />
            </div>

            {error ? <div className='notice'>{error}</div> : null}

            <div className='section'>
              <h2>Regex breakdown</h2>
              <RegexBreakdown pattern={pattern} />
            </div>

            <div className='section'>
              <h2>Flags explained</h2>
              <FlagsPanel flags={flags} />
            </div>
          </div>
        </section>

        <section className='panel panel-scroll output'>
          <div className='panel-header panel-header-compact'>
            <h2>Match results</h2>
            <button
              className='button button-subtle'
              type='button'
              onClick={() => setWrapMatches((value) => !value)}
            >
              {wrapMatches ? 'Wrap On' : 'Wrap Off'}
            </button>
          </div>
          <div className='panel-body'>
            <MatchesOutput lines={lines} matches={matches} wrap={wrapMatches} />

            <div className='section'>
              <h2>Capture groups</h2>
              <GroupsPanel groups={groups} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App />);
