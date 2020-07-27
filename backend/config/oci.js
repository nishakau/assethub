const os = require("oci-objectstorage");
const common = require("oci-common");

const configurationFilePath = "~/.oci/config";
const configProfile = "DEFAULT";

const provider = new common.ConfigFileAuthenticationDetailsProvider(
  configurationFilePath,
  configProfile
);

const client = new os.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});
client.region = common.Region.US_ASHBURN_1;

const compartmentId =
  "ocid1.compartment.oc1..aaaaaaaamphpkpoeoduewkdr7cr5ikjl4trqwqckr7vge7rszpt5ydziiwoa";

const namespace  = "orasenatdpltinfomgmt03";

module.exports = {
  client,
  compartmentId,
  namespace
};
