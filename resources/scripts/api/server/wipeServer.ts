import loadDirectory from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';
import updateStartupVariable from '@/api/server/updateStartupVariable';

export default (uuid: string, regenSeed: boolean, deleteWorld: boolean, deletePlayerData: boolean): Promise<void> => {
    const directory = '/server/rust';

    return new Promise((resolve, reject) => {
        loadDirectory(uuid, directory)
            .then((files) => {
                const filesToDelete = files.filter(file => {
                    if (deleteWorld && (file.name.endsWith('.sav') || file.name.endsWith('.sav.1') || file.name.endsWith('.sav.2') || file.name.endsWith('.map'))) {
                        return true;
                    }

                    return deletePlayerData && file.name.startsWith('player.') && (file.name.endsWith('.db') || file.name.endsWith('.db-journal'));
                });
                deleteFiles(uuid, directory, filesToDelete.map(file => file.name))
                    .then(() => {
                        if (regenSeed) {
                            updateStartupVariable(uuid, 'WORLD_SEED', (Math.floor(132132 + Math.random() * 132132132)).toString())
                                .then(() => resolve)
                                .catch(reject);
                        }
                    })
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
};
