# structured

> [!NOTE]
> see [demo](https://x.com/Nathan_Nowack/status/1874650896753479902)

a web app for generating structured outputs from natural language prompts.

## features

- schema-driven output generation
- version control for schemas
- generation history and favorites
- real-time updates

## setup

### prerequisites
- uv for python environment management
- bun for frontend development

### development
```bash
make install  # install dependencies
make api      # start api
make ui       # start ui
make upgrade  # upgrade database
make downgrade # downgrade database
make autogenerate-revision # autogenerate a revision
```

## architecture

### backend
- REST API with SQLite database
- AI-powered schema generation
- schema versioning system

### frontend
single page application, vite + react + shadcn/ui

## development

```bash
make clean    # clean all artifacts
```
