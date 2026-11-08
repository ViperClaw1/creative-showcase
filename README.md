# Creative Showcase

A portfolio app for publishing creative projects. Visitors can browse work, react to it, leave comments, and send a message. The admin manages everything from a private dashboard.

## Features

**For visitors**

- Animated hero and a list of published projects on the home page
- Project pages with an image and video gallery
- Likes and dislikes, and comments, using anonymous sessions (no sign-up)
- Validated contact form

**For the admin**

- Email and password login at `/admin/login`
- Create, edit, and publish or unpublish projects, with image and video uploads
- Review comments and contact messages

## Tech stack

- React 18, TypeScript, and Vite
- Tailwind CSS, shadcn/ui, and Framer Motion
- TanStack Query, React Hook Form, and Zod
- Supabase (Postgres, Auth, Storage)
- Vitest and Testing Library

## Getting started

You need Node.js and npm.

```sh
git clone https://github.com/ViperClaw1/creative-showcase.git
cd creative-showcase
npm install
npm run dev
```

The app runs at <http://localhost:8080>.

The repository includes a `.env` file, so a fresh clone connects to the Supabase project already configured there. To use your own backend, follow the steps below.

## Using your own Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Set your project's values in `.env`:

   ```sh
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
   ```

3. In `supabase/migrations/20260419181039_*.sql`, replace the hardcoded email with your admin's email. Any account that signs up with this email becomes an admin, so do this before applying the migrations.
4. Apply the migrations using the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```sh
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

5. In the Supabase dashboard, enable **Anonymous sign-ins** under Authentication. Reactions and comments depend on them.
6. Create a user with the admin email under Authentication > Users, then sign in at `/admin/login`.

## Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the dev server             |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run ESLint                       |
| `npm test`        | Run the tests once               |

## Lovable

This project is also edited in [Lovable](https://lovable.dev/projects/8b085be7-2367-41c9-8cfa-198667c09331). Pushes to `main` sync back to the Lovable editor, and changes made there are committed to this repository.
