import loadDirectory from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';

export default (uuid: string, paths: string[]): Promise<void> => {
    const folderRgx = /^(\/\w+)+$/;
    const fileRgx = /\/(\*|\w+)(\.[a-zA-Z0-9_-]+)+$/;
    const fileWildcardRgx = /\*(\.[a-zA-Z0-9_-]+)+$/;
    const fileSpecificRgx = /\w+(\.[a-zA-Z0-9_-]+)+$/;

    return new Promise((resolve, reject) => {
        for (const path of paths) {
            if (folderRgx.test(path)) {
                loadDirectory(uuid, path)
                    .then((files) => {
                        const filesToDelete = files.filter(() => {
                            return true;
                        });
                        deleteFiles(uuid, path, filesToDelete.map(file => file.name))
                            .then(resolve)
                            .catch(reject);
                    })
                    .catch(reject);
            }
            if (fileRgx.test(path)) {
                const index = path.lastIndexOf('/');
                const folderPath = path.substr(0, index);
                const fileName = path.substr(index + 1);
                loadDirectory(uuid, folderPath)
                    .then((files) => {
                        const filesToDelete = files.filter(file => {
                            if (fileSpecificRgx.test(fileName) && file.name === fileName) return true;
                            if (fileWildcardRgx.test(fileName) && file.name.endsWith(fileName.substr(fileName.lastIndexOf('*') + 1))) return true;
                            return false;
                        });
                        deleteFiles(uuid, folderPath, filesToDelete.map(file => file.name))
                            .then(resolve)
                            .catch(reject);
                    })
                    .catch(reject);
            }
        }
        return true;
    });
};
