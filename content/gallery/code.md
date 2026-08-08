---
title: Code
description: A fence is an editor. Several fences in a wrapper become one tabbed editor.
order: 4
---

A plain fence renders as an editor with no chrome:

```robot-repl
Click       text=Sign in
Get Text    h1    ==    Welcome
```

Naming the file in the fence info string gives it a tab:

```robot [login.robot]
*** Settings ***
Library    Browser

*** Test Cases ***
Sign In
    Click    text=Sign in
```

Several fences inside `::code-tabs` become one editor with a tab each — the
code stays in the body, where it is readable and editable:

::code-tabs
```robot [login.robot]
*** Test Cases ***
Sign In
    New Page     https://example.com/login
    Fill Text    id=user    admin
    Get Text     h1    ==    Welcome
```

```python [test_login.py]
from Browser import Browser

browser = Browser()

def test_sign_in():
    browser.new_page("https://example.com/login")
    browser.fill_text("id=user", "admin")
    browser.get_text("h1", "==", "Welcome")
```
::
