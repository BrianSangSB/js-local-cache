

const APP_ID = 'APPLICATION ID HERE';
var USER_ID = 'USER ID HERE';
var ACCESS_TOKEN = null;
var sb;
const USE_LOCAL_CACHE = true;


// Init Sendbird
sb = new SendBird({ appId: APP_ID, localCacheEnabled: true });
// Connect to chat
sb.connect(USER_ID, ACCESS_TOKEN, (user, error) => {
    if (error) {
        console.log('Unable to connect. You need to get a first connection to access Local Cache');
    } else {
        getChannelList(() => {
            console.log('DONE');
        });
    }
})


function getChannelList(callback) {
    // Set your filters
    var groupChannelFilter = new sb.GroupChannelFilter();
    groupChannelFilter.includeEmpty = true;

    // Define your channel sort order
    const order = sb.GroupChannelCollection.GroupChannelOrder.LATEST_LAST_MESSAGE;

    // Create the Builder
    var groupChannelCollection = sb.GroupChannel.createGroupChannelCollection()
        .setOrder(order)
        .setFilter(groupChannelFilter)
        .build();

    // This handler will get the information
    groupChannelCollection.setGroupChannelCollectionHandler({
        onChannelsAdded: (context, channels) => {
            console.log('Local cache: onChannelsAdded', channels);
            callback({
                action: 'add',
                context,
                channels
            })
        },
        onChannelsUpdated: (context, channels) => {
            console.log('Local cache: onChannelsUpdated', channels);
            callback({
                action: 'update',
                context,
                channels
            })
        },
        onChannelsDeleted: (context, channelUrls) => {
            console.log('Local cache: onChannelsDeleted', channelUrls);
            callback({
                action: 'delete',
                context,
                channelUrls
            })
        },
    });

    // Request the info
    try {
        groupChannelCollection.loadMore().then((channels) => {
            callback(channels);
        });
    } catch (e) {
        console.log('Error getting channels', e);
    }
}
