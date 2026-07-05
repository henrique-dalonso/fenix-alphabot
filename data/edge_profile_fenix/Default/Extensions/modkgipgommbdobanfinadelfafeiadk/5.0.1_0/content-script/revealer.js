$(window).ready(function() {
    if (($("article .extension").length > 0) || ($("#event").length > 0))
        chrome.storage.sync.set({"givee.actual": parseInt(new Date().getTime() / 1000)});

    if ($("article .extension").length) {
        $("article .extension").addClass("installed");
        var timestamp = $("article .extension").data("timestamp");
        var csrf = $("article .extension").data("csrf");
        var extension = md5(timestamp+""+csrf);
        var secret = $("article .extension").data("secret");

        var toggleActionButton = function(button) {
            $(button).toggleClass("btn-default btn-success disabled").prop("disabled", "disabled").find("i.glyphicon-refresh").toggleClass("glyphicon-refresh glyphicon-ok").removeClass("spin");

            if ($("#actions .btn-success[data-type]").length == $("#actions tr").length) {
                var button = $("#getKey a");
                var actions = 0;
                $("#actions [data-action-id]").each(function(i,el){
                    actions += parseInt($(el).data("action-id"));
                });
                $(button).attr("href", $(button).attr("href")+"&actions="+md5(actions)).removeClass("disabled");
            }
        };

        chrome.runtime.sendMessage({type: "actions", data: {path: "https://"+window.location.host+window.location.pathname+"?extension="+extension+"&timestamp="+timestamp+"&version=chrome-"+chrome.runtime.getManifest().version+"&csrf="+csrf+(secret ? "&secret="+secret : "")}}, function(response) {
            if (response) {
                response = response.replace(/(<script.+?\/script>)/guis, '');
                $("article").replaceWith(response);
                $("article").attr("extension-version", "chrome-"+chrome.runtime.getManifest().version);
            }
        });

        $(document).on("click", "#actions a[data-type='trigger']", function() {
            toggleActionButton($(this).closest("tr").find(".btn-default[data-type='link']"));
        });

        $(document).on("click", "#actions .btn-default[data-type='link']", function() {
            if ($(this).is("a"))
                toggleActionButton($(this));
        });

        $(document).on("click", "#actions [data-trigger='link']", function() {
            toggleActionButton($(this).closest("tr").find("button i.glyphicon-refresh").parent());
        });

        $(document).on("click", "#actions button[data-type='action.universal']", function() {
            var button = $(this).prop("disabled", "disabled");
            $(button).find("i").addClass("spin");
            var action = JSON.parse(window.atob($(this).data("action")));
            action.checker = "https://"+window.location.host+"/action/check/"+action.id;
            setTimeout(function() {
                chrome.runtime.sendMessage({type: "action", data: action}, function(response) {
                    if (response && response.success) {
                        $(button).attr("data-result", response.result);
                        toggleActionButton(button);
                    } else {
                        if (response && response.error) {
                            //($("#giveaway-log").val($.trim("ERROR: "+ response.error + "\r\n" + $("#giveaway-log").val())))[0].click();
                        }
                        $(button).prop("disabled", false).find(".glyphicon.spin").removeClass("spin");
                    }
                });
            }, ((action.wait && (parseInt(action.wait) > 0)) ? action.wait : 100));
        });
    }
});