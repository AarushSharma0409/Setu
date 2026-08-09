# Insurance production smoke-test plan

Run only in an approved controlled environment after deployment and without
creating a real policy purchase.

- [ ] Verify live and ready health endpoints without exposing dependency data.
- [ ] Verify admin login, MFA challenge, recovery process, and logout with a
      controlled administrator.
- [ ] Verify insurance landing and only approved policy-type visibility.
- [ ] Verify controlled customer authentication and a draft assessment; confirm
      no sensitive response is cacheable or persisted in browser storage.
- [ ] Verify provider health with sandbox credentials and the exact allowlisted
      host.
- [ ] Verify operations dashboard permissions, audit recording, and redacted
      error/log output.
- [ ] Verify an expired/reused handoff state is rejected and no purchase is
      initiated.
- [ ] Verify rollback/kill-switch contacts before enabling any provider path.
