1.)code_versions:
create table public.code_versions (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  version_number integer not null,
  code text not null,
  plot_url text null,
  description text null,
  created_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint code_versions_pkey primary key (id),
  constraint code_versions_project_id_version_number_key unique (project_id, version_number),
  constraint code_versions_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint code_versions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_code_versions_project_id on public.code_versions using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_code_versions_version_number on public.code_versions using btree (project_id, version_number) TABLESPACE pg_default;

create index IF not exists idx_code_versions_user_id on public.code_versions using btree (user_id) TABLESPACE pg_default;

2.)collaboration_requests:
create table public.collaboration_requests (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  from_user_id uuid not null,
  to_user_id uuid not null,
  role text not null,
  message text null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint collaboration_requests_pkey primary key (id),
  constraint collaboration_requests_project_id_from_user_id_to_user_id_s_key unique (project_id, from_user_id, to_user_id, status) deferrable initially DEFERRED,
  constraint collaboration_requests_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint collaboration_requests_from_user_id_fkey foreign KEY (from_user_id) references auth.users (id) on delete CASCADE,
  constraint collaboration_requests_to_user_id_fkey foreign KEY (to_user_id) references auth.users (id) on delete CASCADE,
  constraint collaboration_requests_role_check check ((role = any (array['edit'::text, 'view'::text]))),
  constraint collaboration_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'declined'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_collaboration_requests_project_id on public.collaboration_requests using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_collaboration_requests_from_user_id on public.collaboration_requests using btree (from_user_id) TABLESPACE pg_default;

create index IF not exists idx_collaboration_requests_to_user_id on public.collaboration_requests using btree (to_user_id) TABLESPACE pg_default;

create index IF not exists idx_collaboration_requests_status on public.collaboration_requests using btree (status) TABLESPACE pg_default;

create trigger update_collaboration_requests_updated_at BEFORE
update on collaboration_requests for EACH row
execute FUNCTION update_updated_at_column ();

3.)messages:
create table public.messages (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  role text not null,
  content text not null,
  code text null,
  plot_url text null,
  created_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint messages_pkey primary key (id),
  constraint messages_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint messages_role_check check (
    (
      role = any (array['user'::text, 'assistant'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_messages_project_id on public.messages using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_messages_user_id on public.messages using btree (user_id) TABLESPACE pg_default;

4.)profiles:
create table public.profiles (
  id uuid not null,
  display_name text null,
  avatar_url text null,
  bio text null,
  location text null,
  website text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_profiles_id on public.profiles using btree (id) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();

5.)project_chat_messages:
create table public.project_chat_messages (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  user_id uuid not null,
  message text not null,
  created_at timestamp with time zone null default now(),
  code_selection text null,
  code_selection_start_line integer null,
  code_selection_end_line integer null,
  constraint project_chat_messages_pkey primary key (id),
  constraint project_chat_messages_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_chat_messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_project_chat_messages_project_id on public.project_chat_messages using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_chat_messages_created_at on public.project_chat_messages using btree (project_id, created_at desc) TABLESPACE pg_default;

6.)project_collaborators:
create table public.project_collaborators (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  user_id uuid not null,
  role text not null,
  invited_by uuid null,
  status text not null default 'accepted'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint project_collaborators_pkey primary key (id),
  constraint project_collaborators_project_id_user_id_key unique (project_id, user_id),
  constraint project_collaborators_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_collaborators_invited_by_fkey foreign KEY (invited_by) references auth.users (id) on delete set null,
  constraint project_collaborators_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint project_collaborators_role_check check (
    (
      role = any (array['owner'::text, 'edit'::text, 'view'::text])
    )
  ),
  constraint project_collaborators_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'declined'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_project_collaborators_project_id on public.project_collaborators using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_collaborators_user_id on public.project_collaborators using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_project_collaborators_status on public.project_collaborators using btree (status) TABLESPACE pg_default;

create trigger update_project_collaborators_updated_at BEFORE
update on project_collaborators for EACH row
execute FUNCTION update_updated_at_column ();

7.)projects:
create table public.projects (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  description text null,
  code text null default '# Your R code will appear here'::text,
  plot_url text null,
  dataset text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_shared boolean null default false,
  stdout text null,
  stderr text null,
  hipaa_compliant boolean null default false,
  context_window text null,
  constraint projects_pkey primary key (id),
  constraint unique_project_name_per_user unique (user_id, name),
  constraint projects_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_projects_user_id on public.projects using btree (user_id) TABLESPACE pg_default;

create trigger update_projects_updated_at BEFORE
update on projects for EACH row
execute FUNCTION update_updated_at_column ();

8.)shared_datasets:
create table public.shared_datasets (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  user_id uuid not null,
  file_name text not null,
  csv_text text not null,
  size_bytes integer not null,
  include_chat boolean null default true,
  include_run boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint shared_datasets_pkey primary key (id),
  constraint shared_datasets_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint shared_datasets_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_shared_datasets_project_id on public.shared_datasets using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_shared_datasets_user_id on public.shared_datasets using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_shared_datasets_created_at on public.shared_datasets using btree (created_at) TABLESPACE pg_default;

create trigger update_shared_datasets_updated_at_trigger BEFORE
update on shared_datasets for EACH row
execute FUNCTION update_shared_datasets_updated_at ();