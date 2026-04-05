## Why this order matters
```
01 → extensions first   (features needed by schema)
02 → schema second      (tables needed by seeds)
03 → seeds last         (data goes into tables)
```

If you run them out of order it breaks:
- Schema without extensions → vector column fails
- Seeds without schema → no tables to insert into

---

## Simple analogy
```
01_extensions  =  install the tools
02_schema      =  build the house
03_seeds       =  move in the furniture