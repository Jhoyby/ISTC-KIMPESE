# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, updateUser, deleteUser, getCurrentUser, listAllUsers, createSiteSettings, updateSiteSettings, deleteSiteSettings, getSiteSettings, listSiteSettings } from '@dataconnect/generated';


// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation UpdateUser: 
const { data } = await UpdateUser(dataConnect);

// Operation DeleteUser: 
const { data } = await DeleteUser(dataConnect);

// Operation GetCurrentUser: 
const { data } = await GetCurrentUser(dataConnect);

// Operation ListAllUsers: 
const { data } = await ListAllUsers(dataConnect);

// Operation CreateSiteSettings: 
const { data } = await CreateSiteSettings(dataConnect);

// Operation UpdateSiteSettings:  For variables, look at type UpdateSiteSettingsVars in ../index.d.ts
const { data } = await UpdateSiteSettings(dataConnect, updateSiteSettingsVars);

// Operation DeleteSiteSettings:  For variables, look at type DeleteSiteSettingsVars in ../index.d.ts
const { data } = await DeleteSiteSettings(dataConnect, deleteSiteSettingsVars);

// Operation GetSiteSettings:  For variables, look at type GetSiteSettingsVars in ../index.d.ts
const { data } = await GetSiteSettings(dataConnect, getSiteSettingsVars);

// Operation ListSiteSettings: 
const { data } = await ListSiteSettings(dataConnect);


```