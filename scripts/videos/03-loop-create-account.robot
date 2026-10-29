*** Settings ***
Documentation       Loop: the name in the email address and the password become arguments,
...                 both without default, and replace their second occurrence.
Resource            video.resource

Test Teardown       End A Failed Session


*** Variables ***
${ACCOUNT}      file://${CURDIR}/pages/create-account.html


*** Test Cases ***
Loop Create Account
    ${video} =    Open Video Page    ${ACCOUNT}    toolbar_x=470    toolbar_y=40
    ${recording} =    Promise To    Record Keyword    Create Account    ${RAW}/loop-create-account.resource
    ...    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    # Typed without the pointer: this loop is about the toolbar.
    Fill Text    id=email    jane@example.com
    Fill Text    id=email-confirm    jane@example.com
    Fill Text    id=password    Secret-123
    Fill Text    id=password-confirm    Secret-123
    Click Slowly    text=Create account >> nth=1
    Wait For Function    () => window.__rfbToolbarState.calls.length === 5
    Sleep    0.8s
    Make Argument Of Part    jane@example.com    0    4    name
    Replace Everywhere
    # The whole value: nothing to mark.
    Make Argument Of Part    Secret-123    ${None}    ${None}    password
    Replace Everywhere
    Wait For Function    () => window.__rfbToolbarState.arguments.length === 2
    Save Loop As    ${video}    loop-create-account    ${recording}


*** Keywords ***
Make Argument Of Part
    [Documentation]    Opens the argument dialog on the first value reading ``text``, marks
    ...    ``text[start:end]``, if given, and makes it an argument without default.
    [Arguments]    ${text}    ${start}    ${end}    ${name}
    Click Toolbar
    ...    () => [...window.toolbarRoot.querySelectorAll('.cell.pick')].find((c) => c.textContent === '${text}')
    Sleep    0.5s
    IF    $start is not None    Mark In Dialog    ${start}    ${end}
    Click Toolbar Button    argName
    Type Slowly    ${name}
    Click Toolbar Button    argDefault
    Sleep    0.4s
    Click Toolbar Button    argOk
    Sleep    0.8s

Replace Everywhere
    Wait For Function    () => !!window.__rfbToolbarState.offer
    Sleep    0.6s
    Click Toolbar Button    offerApply
    Sleep    0.8s

Mark In Dialog
    [Documentation]    Drags across ``value[start:end]`` in the dialog, as a user marks it.
    [Arguments]    ${start}    ${end}
    ${from} =    Character Edge    ${start}    1
    ${to} =    Character Edge    ${end}    -1
    Glide To    ${from}[0]    ${from}[1]
    Mouse Button    down
    Mouse Move    ${to}[0]    ${to}[1]    steps=20
    Mouse Button    up
    Sleep    0.6s

Character Edge
    [Documentation]    The viewport point at the edge before character ``index`` of the
    ...    single-line dialog value, moved ``nudge`` pixels into the marked part.
    [Arguments]    ${index}    ${nudge}
    ${point} =    Evaluate JavaScript    ${None}
    ...    () => {
    ...      const t = window.toolbarRoot.getElementById('argValue');
    ...      const s = getComputedStyle(t);
    ...      const ctx = document.createElement('canvas').getContext('2d');
    ...      ctx.font = s.font;
    ...      const r = t.getBoundingClientRect();
    ...      const x = r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft)
    ...        + ctx.measureText(t.value.slice(0, ${index})).width - t.scrollLeft + ${nudge};
    ...      const y = r.top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop)
    ...        + (parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2) / 2;
    ...      return [x, y];
    ...    }
    RETURN    ${point}
