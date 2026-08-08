---
title: Split panes
description: Two panes, either expandable to 75%. Generic — the panes hold anything, not only code.
order: 6
---

::split-panes
---
left: Before
right: After
notes: [No draggable divider, Works without JavaScript, Stacks below 640px]
---
#left
```robot-repl
Wait Until Element Is Visible    id=user
Sleep    1s
Input Text    id=user    admin
${text}=    Get Text    h1
Should Be Equal    ${text}    Welcome
```

#right
```robot-repl
Fill Text    id=user    admin
Get Text     h1    ==    Welcome
```
::

Click ⤢ on either pane to expand it; ⤡ restores parity. The narrow pane is
never hidden — keeping both visible is the point.
