# Features

Feature-oriented modules are added by their domain layer (see `docs/MASTER_SPEC.md` build
order). Each feature folder follows this shape:

    <feature>/
      components/
      hooks/
      <feature>Service.ts
      schema.ts
      types.ts

Page components stay thin; business logic lives in the service / hooks / repository, never
in `src/app/**` route files. No feature code exists yet at the foundation layer.
