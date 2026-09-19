import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateCommentData {
  comment_insert: Comment_Key;
}

export interface CreateCommentVariables {
  postId: UUIDString;
  content: string;
  author: string;
}

export interface CreatePostData {
  post_insert: Post_Key;
}

export interface CreatePostVariables {
  title: string;
  content: string;
}

export interface CreateProjectData {
  project_insert: Project_Key;
}

export interface CreateProjectVariables {
  title: string;
  desc: string;
  url: string;
}

export interface CreateSiteSettingsData {
  siteSettings_insert: SiteSettings_Key;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteCommentData {
  comment_delete?: Comment_Key | null;
}

export interface DeleteCommentVariables {
  id: UUIDString;
}

export interface DeletePostData {
  post_delete?: Post_Key | null;
}

export interface DeletePostVariables {
  id: UUIDString;
}

export interface DeleteProjectData {
  project_delete?: Project_Key | null;
}

export interface DeleteProjectVariables {
  id: UUIDString;
}

export interface DeleteSiteSettingsData {
  siteSettings_delete?: SiteSettings_Key | null;
}

export interface DeleteSiteSettingsVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface GetCommentData {
  comment?: {
    content: string;
    authorName: string;
    createdAt: TimestampString;
  };
}

export interface GetCommentVariables {
  id: UUIDString;
}

export interface GetCurrentUserData {
  user?: {
    email: string;
    username: string;
    displayName: string;
    bio?: string | null;
    profileImageUrl?: string | null;
  };
}

export interface GetPostData {
  post?: {
    title: string;
    content: string;
    status: string;
    createdAt: TimestampString;
  };
}

export interface GetPostVariables {
  id: UUIDString;
}

export interface GetProjectData {
  project?: {
    title: string;
    description: string;
    projectUrl: string;
    imageUrl?: string | null;
  };
}

export interface GetProjectVariables {
  id: UUIDString;
}

export interface GetSiteSettingsData {
  siteSettings?: {
    siteTitle: string;
    themeColor: string;
    tagline?: string | null;
    socialLinks?: string | null;
  };
}

export interface GetSiteSettingsVariables {
  id: UUIDString;
}

export interface ListAllUsersData {
  users: ({
    username: string;
    displayName: string;
    profileImageUrl?: string | null;
  })[];
}

export interface ListCommentsData {
  comments: ({
    content: string;
    authorName: string;
  })[];
}

export interface ListCommentsVariables {
  postId: UUIDString;
}

export interface ListPostsData {
  posts: ({
    title: string;
    createdAt: TimestampString;
  })[];
}

export interface ListProjectsData {
  projects: ({
    title: string;
    projectUrl: string;
  })[];
}

export interface ListSiteSettingsData {
  siteSettingss: ({
    siteTitle: string;
  })[];
}

export interface Post_Key {
  id: UUIDString;
  __typename?: 'Post_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface SiteSettings_Key {
  id: UUIDString;
  __typename?: 'SiteSettings_Key';
}

export interface UpdateCommentData {
  comment_update?: Comment_Key | null;
}

export interface UpdateCommentVariables {
  id: UUIDString;
  content?: string | null;
}

export interface UpdatePostData {
  post_update?: Post_Key | null;
}

export interface UpdatePostVariables {
  id: UUIDString;
  title?: string | null;
}

export interface UpdateProjectData {
  project_update?: Project_Key | null;
}

export interface UpdateProjectVariables {
  id: UUIDString;
  desc?: string | null;
}

export interface UpdateSiteSettingsData {
  siteSettings_update?: SiteSettings_Key | null;
}

export interface UpdateSiteSettingsVariables {
  id: UUIDString;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(): MutationPromise<UpdateUserData, undefined>;
export function updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetCurrentUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
  operationName: string;
}
export const getCurrentUserRef: GetCurrentUserRef;

export function getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;
export function getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface ListAllUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
  operationName: string;
}
export const listAllUsersRef: ListAllUsersRef;

export function listAllUsers(options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;
export function listAllUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;

interface CreateSiteSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateSiteSettingsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateSiteSettingsData, undefined>;
  operationName: string;
}
export const createSiteSettingsRef: CreateSiteSettingsRef;

export function createSiteSettings(): MutationPromise<CreateSiteSettingsData, undefined>;
export function createSiteSettings(dc: DataConnect): MutationPromise<CreateSiteSettingsData, undefined>;

interface UpdateSiteSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSiteSettingsVariables): MutationRef<UpdateSiteSettingsData, UpdateSiteSettingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSiteSettingsVariables): MutationRef<UpdateSiteSettingsData, UpdateSiteSettingsVariables>;
  operationName: string;
}
export const updateSiteSettingsRef: UpdateSiteSettingsRef;

export function updateSiteSettings(vars: UpdateSiteSettingsVariables): MutationPromise<UpdateSiteSettingsData, UpdateSiteSettingsVariables>;
export function updateSiteSettings(dc: DataConnect, vars: UpdateSiteSettingsVariables): MutationPromise<UpdateSiteSettingsData, UpdateSiteSettingsVariables>;

interface DeleteSiteSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSiteSettingsVariables): MutationRef<DeleteSiteSettingsData, DeleteSiteSettingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSiteSettingsVariables): MutationRef<DeleteSiteSettingsData, DeleteSiteSettingsVariables>;
  operationName: string;
}
export const deleteSiteSettingsRef: DeleteSiteSettingsRef;

export function deleteSiteSettings(vars: DeleteSiteSettingsVariables): MutationPromise<DeleteSiteSettingsData, DeleteSiteSettingsVariables>;
export function deleteSiteSettings(dc: DataConnect, vars: DeleteSiteSettingsVariables): MutationPromise<DeleteSiteSettingsData, DeleteSiteSettingsVariables>;

interface GetSiteSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSiteSettingsVariables): QueryRef<GetSiteSettingsData, GetSiteSettingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSiteSettingsVariables): QueryRef<GetSiteSettingsData, GetSiteSettingsVariables>;
  operationName: string;
}
export const getSiteSettingsRef: GetSiteSettingsRef;

export function getSiteSettings(vars: GetSiteSettingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSiteSettingsData, GetSiteSettingsVariables>;
export function getSiteSettings(dc: DataConnect, vars: GetSiteSettingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSiteSettingsData, GetSiteSettingsVariables>;

interface ListSiteSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSiteSettingsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSiteSettingsData, undefined>;
  operationName: string;
}
export const listSiteSettingsRef: ListSiteSettingsRef;

export function listSiteSettings(options?: ExecuteQueryOptions): QueryPromise<ListSiteSettingsData, undefined>;
export function listSiteSettings(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSiteSettingsData, undefined>;

interface CreatePostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
  operationName: string;
}
export const createPostRef: CreatePostRef;

export function createPost(vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;
export function createPost(dc: DataConnect, vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;

interface UpdatePostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePostVariables): MutationRef<UpdatePostData, UpdatePostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePostVariables): MutationRef<UpdatePostData, UpdatePostVariables>;
  operationName: string;
}
export const updatePostRef: UpdatePostRef;

export function updatePost(vars: UpdatePostVariables): MutationPromise<UpdatePostData, UpdatePostVariables>;
export function updatePost(dc: DataConnect, vars: UpdatePostVariables): MutationPromise<UpdatePostData, UpdatePostVariables>;

interface DeletePostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePostVariables): MutationRef<DeletePostData, DeletePostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePostVariables): MutationRef<DeletePostData, DeletePostVariables>;
  operationName: string;
}
export const deletePostRef: DeletePostRef;

export function deletePost(vars: DeletePostVariables): MutationPromise<DeletePostData, DeletePostVariables>;
export function deletePost(dc: DataConnect, vars: DeletePostVariables): MutationPromise<DeletePostData, DeletePostVariables>;

interface GetPostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPostVariables): QueryRef<GetPostData, GetPostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPostVariables): QueryRef<GetPostData, GetPostVariables>;
  operationName: string;
}
export const getPostRef: GetPostRef;

export function getPost(vars: GetPostVariables, options?: ExecuteQueryOptions): QueryPromise<GetPostData, GetPostVariables>;
export function getPost(dc: DataConnect, vars: GetPostVariables, options?: ExecuteQueryOptions): QueryPromise<GetPostData, GetPostVariables>;

interface ListPostsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPostsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPostsData, undefined>;
  operationName: string;
}
export const listPostsRef: ListPostsRef;

export function listPosts(options?: ExecuteQueryOptions): QueryPromise<ListPostsData, undefined>;
export function listPosts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPostsData, undefined>;

interface CreateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProjectVariables): MutationRef<CreateProjectData, CreateProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProjectVariables): MutationRef<CreateProjectData, CreateProjectVariables>;
  operationName: string;
}
export const createProjectRef: CreateProjectRef;

export function createProject(vars: CreateProjectVariables): MutationPromise<CreateProjectData, CreateProjectVariables>;
export function createProject(dc: DataConnect, vars: CreateProjectVariables): MutationPromise<CreateProjectData, CreateProjectVariables>;

interface UpdateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProjectVariables): MutationRef<UpdateProjectData, UpdateProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProjectVariables): MutationRef<UpdateProjectData, UpdateProjectVariables>;
  operationName: string;
}
export const updateProjectRef: UpdateProjectRef;

export function updateProject(vars: UpdateProjectVariables): MutationPromise<UpdateProjectData, UpdateProjectVariables>;
export function updateProject(dc: DataConnect, vars: UpdateProjectVariables): MutationPromise<UpdateProjectData, UpdateProjectVariables>;

interface DeleteProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProjectVariables): MutationRef<DeleteProjectData, DeleteProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteProjectVariables): MutationRef<DeleteProjectData, DeleteProjectVariables>;
  operationName: string;
}
export const deleteProjectRef: DeleteProjectRef;

export function deleteProject(vars: DeleteProjectVariables): MutationPromise<DeleteProjectData, DeleteProjectVariables>;
export function deleteProject(dc: DataConnect, vars: DeleteProjectVariables): MutationPromise<DeleteProjectData, DeleteProjectVariables>;

interface GetProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
  operationName: string;
}
export const getProjectRef: GetProjectRef;

export function getProject(vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;
export function getProject(dc: DataConnect, vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;

interface ListProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProjectsData, undefined>;
  operationName: string;
}
export const listProjectsRef: ListProjectsRef;

export function listProjects(options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;
export function listProjects(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;

interface CreateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  operationName: string;
}
export const createCommentRef: CreateCommentRef;

export function createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;
export function createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface UpdateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCommentVariables): MutationRef<UpdateCommentData, UpdateCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCommentVariables): MutationRef<UpdateCommentData, UpdateCommentVariables>;
  operationName: string;
}
export const updateCommentRef: UpdateCommentRef;

export function updateComment(vars: UpdateCommentVariables): MutationPromise<UpdateCommentData, UpdateCommentVariables>;
export function updateComment(dc: DataConnect, vars: UpdateCommentVariables): MutationPromise<UpdateCommentData, UpdateCommentVariables>;

interface DeleteCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCommentVariables): MutationRef<DeleteCommentData, DeleteCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCommentVariables): MutationRef<DeleteCommentData, DeleteCommentVariables>;
  operationName: string;
}
export const deleteCommentRef: DeleteCommentRef;

export function deleteComment(vars: DeleteCommentVariables): MutationPromise<DeleteCommentData, DeleteCommentVariables>;
export function deleteComment(dc: DataConnect, vars: DeleteCommentVariables): MutationPromise<DeleteCommentData, DeleteCommentVariables>;

interface GetCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCommentVariables): QueryRef<GetCommentData, GetCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCommentVariables): QueryRef<GetCommentData, GetCommentVariables>;
  operationName: string;
}
export const getCommentRef: GetCommentRef;

export function getComment(vars: GetCommentVariables, options?: ExecuteQueryOptions): QueryPromise<GetCommentData, GetCommentVariables>;
export function getComment(dc: DataConnect, vars: GetCommentVariables, options?: ExecuteQueryOptions): QueryPromise<GetCommentData, GetCommentVariables>;

interface ListCommentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCommentsVariables): QueryRef<ListCommentsData, ListCommentsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCommentsVariables): QueryRef<ListCommentsData, ListCommentsVariables>;
  operationName: string;
}
export const listCommentsRef: ListCommentsRef;

export function listComments(vars: ListCommentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCommentsData, ListCommentsVariables>;
export function listComments(dc: DataConnect, vars: ListCommentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCommentsData, ListCommentsVariables>;

