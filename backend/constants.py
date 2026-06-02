BADGE_MATRIX = [
    (1000, "The Primordial Void — existence before existence"),
    (810, "The True Omnigod"),
    (601, "The Axiom Lord"),
    (451, "The Concept Eater"),
    (301, "The Causality Emperor"),
    (221, "The World Devourer"),
    (181, "The True Demon God"),
    (151, "The Demon Lord's Right Hand"),
    (136, "The Demon Lord's Four Heavenly Kings"),
    (121, "The Sage"),
    (101, "The Hero (Chosen)"),
    (81, "The Reincarnated Overpowered Protagonist"),
    (61, "The S-Rank Adventurer"),
    (41, "The Knight Commander"),
    (21, "The Academy Student (Gifted)"),
    (0, "The Peasant Who Doesn't Know Magic Exists")
]

def get_title_for_difficulty(difficulty: int) -> str:
    for threshold, title in BADGE_MATRIX:
        if difficulty >= threshold:
            return title
    return BADGE_MATRIX[-1][1]
